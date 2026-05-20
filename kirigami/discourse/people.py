"""Discourse user profile cache and PEP role matching."""

from __future__ import annotations

import json
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterable

import httpx

from kirigami.pep import PepMetadata, PepPerson
from kirigami.store import DISCOURSE_HTTP_CACHE_TTL_SECONDS, KirigamiStore

PROFILE_TTL_SECONDS = DISCOURSE_HTTP_CACHE_TTL_SECONDS
MIN_CONFIRMED_MATCH = 0.65


@dataclass(frozen=True, slots=True)
class DiscourseUserProfile:
    """Cached public Discourse identity information."""

    username: str
    name: str | None = None
    user_id: int | None = None
    avatar_template: str | None = None
    primary_group_name: str | None = None
    trust_level: int | None = None
    admin: bool = False
    moderator: bool = False
    fetched_at: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True, slots=True)
class RoleMatch:
    """A match between a PEP role person and a Discourse username."""

    pep_name: str
    role: str
    username: str | None
    display_name: str | None
    confidence: float
    method: str
    confirmed: bool

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class PeopleCache:
    """Small SQLite cache for Discourse usernames and display names."""

    def __init__(self, path: Path | str) -> None:
        self.path = Path(path)
        self.store = KirigamiStore.from_people_cache_path(self.path)

    def upsert_from_discourse_payload(
        self,
        payload: dict[str, Any],
        *,
        topic_id: int | None = None,
    ) -> None:
        """Record users found in topic, search, or listing payloads."""
        for item in _iter_user_objects(payload):
            profile = profile_from_payload(item)
            if profile is not None:
                self.upsert_profile(profile, topic_id=topic_id, raw=item)

    def upsert_profile(
        self,
        profile: DiscourseUserProfile,
        *,
        topic_id: int | None = None,
        raw: dict[str, Any] | None = None,
    ) -> None:
        self.store.upsert_profile(profile, topic_id=topic_id, raw=raw)

    def get_profile(self, username: str) -> DiscourseUserProfile | None:
        row = self.store.profile_row(username)
        return _profile_from_row(row)

    def all_profiles(self) -> list[DiscourseUserProfile]:
        rows = self.store.profile_rows()
        return [profile for row in rows if (profile := _profile_from_row(row))]

    def stale_usernames(self, usernames: Iterable[str]) -> list[str]:
        return self.store.stale_usernames(usernames, ttl_seconds=PROFILE_TTL_SECONDS)


def fetch_and_cache_profiles(
    usernames: Iterable[str],
    *,
    client: httpx.Client,
    cache: PeopleCache,
) -> list[str]:
    """Fetch stale profile records. Returns warning strings for failures."""
    warnings: list[str] = []
    for username in cache.stale_usernames(sorted(set(usernames), key=str.casefold)):
        try:
            payload = cache.store.get_discourse_json(client, f"/u/{username}.json")
        except (httpx.HTTPError, TypeError, ValueError) as exc:
            warnings.append(f"Could not refresh Discourse profile for @{username}: {exc}")
            continue

        user_payload = payload.get("user") if isinstance(payload, dict) else None
        if isinstance(user_payload, dict):
            profile = profile_from_payload(user_payload)
            if profile is not None:
                cache.upsert_profile(profile, raw=user_payload)
    return warnings


def profile_from_payload(payload: dict[str, Any]) -> DiscourseUserProfile | None:
    username = payload.get("username")
    if not username:
        return None
    return DiscourseUserProfile(
        username=str(username),
        name=str(payload["name"]).strip() if payload.get("name") else None,
        user_id=_int_or_none(payload.get("id")),
        avatar_template=payload.get("avatar_template"),
        primary_group_name=payload.get("primary_group_name"),
        trust_level=_int_or_none(payload.get("trust_level")),
        admin=bool(payload.get("admin")),
        moderator=bool(payload.get("moderator")),
        fetched_at=_utc_now(),
    )


def match_pep_people_to_discourse_users(
    pep_metadata: PepMetadata | None,
    profiles: Iterable[DiscourseUserProfile],
    *,
    aliases: dict[str, str] | None = None,
) -> list[RoleMatch]:
    """Match PEP role names to Discourse profiles with explicit confidence."""
    if pep_metadata is None:
        return []

    profile_list = list(profiles)
    aliases = aliases or {}
    matches: list[RoleMatch] = []
    for role, people in [
        ("author", pep_metadata.authors),
        ("sponsor", pep_metadata.sponsors),
        ("delegate", pep_metadata.delegates),
    ]:
        for person in people:
            matches.append(_best_match(person, role, profile_list, aliases=aliases))
    return matches


def load_aliases(path: Path | str) -> dict[str, str]:
    alias_path = Path(path)
    if not alias_path.is_file():
        return {}
    try:
        payload = json.loads(alias_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    if not isinstance(payload, dict):
        return {}
    return {str(key): str(value) for key, value in payload.items()}


def roles_for_username(matches: Iterable[RoleMatch], username: str) -> list[dict[str, Any]]:
    key = _username_key(username)
    roles = [
        {
            "role": match.role,
            "pep_name": match.pep_name,
            "confidence": match.confidence,
            "method": match.method,
            "confirmed": match.confirmed,
        }
        for match in matches
        if match.username is not None and _username_key(match.username) == key
    ]
    return sorted(roles, key=lambda item: (item["role"], item["pep_name"]))


def _best_match(
    person: PepPerson,
    role: str,
    profiles: list[DiscourseUserProfile],
    *,
    aliases: dict[str, str],
) -> RoleMatch:
    alias_username = aliases.get(person.name)
    if alias_username:
        profile = next(
            (profile for profile in profiles if _username_key(profile.username) == _username_key(alias_username)),
            None,
        )
        return RoleMatch(
            pep_name=person.name,
            role=role,
            username=profile.username if profile else alias_username,
            display_name=profile.name if profile else None,
            confidence=1.0,
            method="alias",
            confirmed=True,
        )

    candidates = [_score_candidate(person, profile) for profile in profiles]
    candidates = [candidate for candidate in candidates if candidate[0] > 0]
    if not candidates:
        return _unmatched(person, role)
    confidence, method, profile = max(candidates, key=lambda item: item[0])
    if confidence < MIN_CONFIRMED_MATCH:
        return _unmatched(person, role, confidence=confidence, method=method)
    return RoleMatch(
        pep_name=person.name,
        role=role,
        username=profile.username,
        display_name=profile.name,
        confidence=confidence,
        method=method,
        confirmed=confidence >= MIN_CONFIRMED_MATCH,
    )


def _score_candidate(
    person: PepPerson,
    profile: DiscourseUserProfile,
) -> tuple[float, str, DiscourseUserProfile]:
    person_key = _name_key(person.name)
    display_key = _name_key(profile.name or "")
    username_key = _name_key(profile.username)
    email_local = None
    if person.email:
        email_local = _name_key(re.split(r"\s+at\s+|@", person.email, maxsplit=1)[0])

    if person_key and display_key and person_key == display_key:
        return (1.0, "display_name", profile)
    if email_local and email_local == username_key:
        return (0.75, "email_local", profile)
    person_tokens = set(person_key.split())
    display_tokens = set(display_key.split())
    if person_tokens and person_tokens <= display_tokens:
        return (0.9, "display_name_tokens", profile)
    compact_person = person_key.replace(" ", "")
    compact_display = display_key.replace(" ", "")
    compact_username = username_key.replace(" ", "")
    if compact_person and compact_person == compact_username:
        return (0.8, "username_compact", profile)
    if compact_person and compact_person == compact_display:
        return (0.8, "display_name_compact", profile)
    if compact_person and (
        compact_person in compact_username or compact_person in compact_display
    ):
        return (0.65, "substring", profile)
    return (0.0, "none", profile)


def _unmatched(
    person: PepPerson,
    role: str,
    *,
    confidence: float = 0,
    method: str = "unmatched",
) -> RoleMatch:
    return RoleMatch(
        pep_name=person.name,
        role=role,
        username=None,
        display_name=None,
        confidence=confidence,
        method=method,
        confirmed=False,
    )


def _iter_user_objects(payload: Any) -> Iterable[dict[str, Any]]:
    if isinstance(payload, dict):
        if payload.get("username"):
            yield payload
        for key in ("users", "participants", "posters"):
            value = payload.get(key)
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        yield item
        for key in ("topic_list", "details"):
            nested = payload.get(key)
            if isinstance(nested, dict):
                yield from _iter_user_objects(nested)
    elif isinstance(payload, list):
        for item in payload:
            yield from _iter_user_objects(item)


def _profile_from_row(row: Any) -> DiscourseUserProfile | None:
    if row is None:
        return None
    return DiscourseUserProfile(
        username=str(row[0]),
        name=row[1],
        user_id=row[2],
        avatar_template=row[3],
        primary_group_name=row[4],
        trust_level=row[5],
        admin=bool(row[6]),
        moderator=bool(row[7]),
        fetched_at=_utc_from_epoch(float(row[8] or 0)),
    )


def _username_key(value: str) -> str:
    return value.casefold()


def _name_key(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", value.casefold())).strip()


def _int_or_none(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _utc_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _utc_from_epoch(value: float) -> str | None:
    if not value:
        return None
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(value))
