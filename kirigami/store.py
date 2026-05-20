"""SQLite-backed storage and cache primitives for Kirigami."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import re
import sqlite3
import time
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

DISCOURSE_HTTP_CACHE_TTL_SECONDS = 5 * 60
API_CACHE_TTL_SECONDS = 5 * 60


@dataclass(frozen=True, slots=True)
class MigrationFile:
    """A single ordered migration loaded from a Python file."""

    number: int
    name: str
    path: Path

    @property
    def checksum(self) -> str:
        return hashlib.sha256(self.path.read_bytes()).hexdigest()

    def migrate(self, store: "KirigamiStore", connection: sqlite3.Connection) -> None:
        module_name = f"kirigami_migration_{self.number:04d}_{self.name}"
        spec = importlib.util.spec_from_file_location(module_name, self.path)
        if spec is None or spec.loader is None:
            raise RuntimeError(f"Could not load migration {self.path}")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        migrate = getattr(module, "migrate", None)
        if not callable(migrate):
            raise RuntimeError(f"Migration {self.path.name} does not define migrate()")
        migrate(store, connection)


class KirigamiStore:
    """A small SQLite store for fetched data, generated output, and API caches."""

    def __init__(
        self,
        path: Path | str,
        *,
        legacy_cache_dir: Path | str | None = None,
        apply_migrations: bool = True,
    ) -> None:
        self.path = Path(path)
        self.legacy_cache_dir = Path(legacy_cache_dir) if legacy_cache_dir is not None else None
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if apply_migrations:
            self._migrate()

    @classmethod
    def from_cache_dir(cls, cache_dir: Path | str) -> "KirigamiStore":
        root = Path(cache_dir)
        configured = os.environ.get("KIRIGAMI_DB_PATH")
        db_path = Path(configured) if configured else root / "kirigami.sqlite"
        return cls(db_path, legacy_cache_dir=root)

    @classmethod
    def from_people_cache_path(cls, path: Path | str) -> "KirigamiStore":
        legacy_path = Path(path)
        configured = os.environ.get("KIRIGAMI_DB_PATH")
        db_path = Path(configured) if configured else legacy_path.parent / "kirigami.sqlite"
        return cls(db_path, legacy_cache_dir=legacy_path.parent)

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        connection.execute("pragma foreign_keys = on")
        return connection

    def get_discourse_json(
        self,
        client: httpx.Client,
        path: str,
        params: dict[str, Any] | list[tuple[str, Any]] | None = None,
        *,
        max_retries: int = 3,
        retry_status_codes: frozenset[int] | None = None,
    ) -> dict[str, Any]:
        """Fetch a Discourse JSON object with a mandatory 5-minute GET cache."""
        retry_status_codes = retry_status_codes or frozenset({429, 502, 503, 504})
        base_url = str(getattr(client, "base_url", "https://discuss.python.org")).rstrip("/")
        query_json = _canonical_query_json(params)
        auth_scope = _auth_scope(client)
        cache_key = _cache_key(base_url, "GET", path, query_json, auth_scope)
        now = time.time()

        with self.connect() as connection:
            self._delete_expired_cache_rows(connection, now=now)
            row = connection.execute(
                """
                select response_json from discourse_http_cache
                where cache_key = ? and expires_epoch > ?
                """,
                (cache_key, now),
            ).fetchone()
            if row is not None:
                payload = json.loads(str(row["response_json"]))
                if not isinstance(payload, dict):
                    raise TypeError(f"expected cached JSON object from {path}")
                return payload

        last_response: httpx.Response | None = None
        for attempt in range(max_retries):
            response = client.get(path, params=params)
            last_response = response
            if response.status_code in retry_status_codes and attempt < max_retries - 1:
                time.sleep(min(0.5 * (2**attempt), 8.0))
                continue
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, dict):
                raise TypeError(f"expected JSON object from {path}, got {type(payload).__name__}")
            self.store_discourse_json(
                base_url=base_url,
                path=path,
                query_json=query_json,
                auth_scope=auth_scope,
                status_code=response.status_code,
                payload=payload,
                fetched_epoch=now,
            )
            return payload

        assert last_response is not None
        last_response.raise_for_status()
        raise RuntimeError("unreachable")

    def store_discourse_json(
        self,
        *,
        base_url: str,
        path: str,
        query_json: str,
        auth_scope: str,
        status_code: int,
        payload: dict[str, Any],
        fetched_epoch: float | None = None,
    ) -> None:
        now = time.time() if fetched_epoch is None else fetched_epoch
        cache_key = _cache_key(base_url, "GET", path, query_json, auth_scope)
        with self.connect() as connection:
            self._delete_expired_cache_rows(connection, now=now)
            connection.execute(
                """
                insert into discourse_http_cache (
                    cache_key, base_url, method, path, query_json, auth_scope,
                    status_code, response_json, fetched_epoch, expires_epoch
                )
                values (?, ?, 'GET', ?, ?, ?, ?, ?, ?, ?)
                on conflict(cache_key) do update set
                    status_code = excluded.status_code,
                    response_json = excluded.response_json,
                    fetched_epoch = excluded.fetched_epoch,
                    expires_epoch = excluded.expires_epoch
                """,
                (
                    cache_key,
                    base_url,
                    path,
                    query_json,
                    auth_scope,
                    status_code,
                    json.dumps(payload, ensure_ascii=False),
                    now,
                    now + DISCOURSE_HTTP_CACHE_TTL_SECONDS,
                ),
            )

    def get_api_cache(self, cache_key: str) -> dict[str, Any] | None:
        now = time.time()
        with self.connect() as connection:
            self._delete_expired_cache_rows(connection, now=now)
            row = connection.execute(
                """
                select payload_json from api_cache_entries
                where cache_key = ? and expires_epoch > ?
                """,
                (cache_key, now),
            ).fetchone()
        if row is None:
            return None
        payload = json.loads(str(row["payload_json"]))
        return payload if isinstance(payload, dict) else None

    def set_api_cache(self, cache_key: str, payload: dict[str, Any]) -> None:
        now = time.time()
        with self.connect() as connection:
            self._delete_expired_cache_rows(connection, now=now)
            connection.execute(
                """
                insert into api_cache_entries (cache_key, payload_json, fetched_epoch, expires_epoch)
                values (?, ?, ?, ?)
                on conflict(cache_key) do update set
                    payload_json = excluded.payload_json,
                    fetched_epoch = excluded.fetched_epoch,
                    expires_epoch = excluded.expires_epoch
                """,
                (
                    cache_key,
                    json.dumps(payload, ensure_ascii=False),
                    now,
                    now + API_CACHE_TTL_SECONDS,
                ),
            )

    def clear_cache_key(self, cache_key: str) -> None:
        """Delete an application cache entry by exact key."""
        with self.connect() as connection:
            connection.execute("delete from api_cache_entries where cache_key = ?", (cache_key,))

    def clear_all_cache(self) -> None:
        """Delete all transient cache rows while preserving durable stored data."""
        with self.connect() as connection:
            connection.execute("delete from discourse_http_cache")
            connection.execute("delete from api_cache_entries")

    def topic_payload(self, topic_id: int, last_posted_at: str) -> dict[str, Any] | None:
        with self.connect() as connection:
            topic = connection.execute(
                """
                select topic_id, title, slug, posts_count, last_posted_at
                from discourse_topics
                where topic_id = ? and last_posted_at = ?
                """,
                (topic_id, last_posted_at),
            ).fetchone()
            if topic is None:
                return None
            posts = connection.execute(
                """
                select post_id, post_number, username, author_name, created_at, updated_at,
                       raw, cooked, reply_count, quote_count, reads, score,
                       reply_to_post_number, user_title, trust_level
                from discourse_posts
                where topic_id = ?
                order by post_number
                """,
                (topic_id,),
            ).fetchall()
        return {
            "topic_id": int(topic["topic_id"]),
            "title": str(topic["title"]),
            "slug": str(topic["slug"]),
            "posts_count": int(topic["posts_count"]),
            "last_posted_at": str(topic["last_posted_at"]),
            "posts": [_post_payload(row) for row in posts],
        }

    def upsert_topic(self, topic: Any, *, raw: dict[str, Any] | None = None) -> None:
        now = time.time()
        with self.connect() as connection:
            connection.execute(
                """
                insert into discourse_topics (
                    topic_id, title, slug, posts_count, last_posted_at, raw_json, fetched_epoch
                )
                values (?, ?, ?, ?, ?, ?, ?)
                on conflict(topic_id) do update set
                    title = excluded.title,
                    slug = excluded.slug,
                    posts_count = excluded.posts_count,
                    last_posted_at = excluded.last_posted_at,
                    raw_json = excluded.raw_json,
                    fetched_epoch = excluded.fetched_epoch
                """,
                (
                    topic.topic_id,
                    topic.title,
                    topic.slug,
                    topic.posts_count,
                    topic.last_posted_at,
                    json.dumps(raw or {}, ensure_ascii=False),
                    now,
                ),
            )
            for post in topic.posts:
                connection.execute(
                    """
                    insert into discourse_posts (
                        post_id, topic_id, post_number, username, author_name, created_at,
                        updated_at, raw, cooked, reply_count, quote_count, reads, score,
                        reply_to_post_number, user_title, trust_level, raw_json
                    )
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    on conflict(post_id) do update set
                        topic_id = excluded.topic_id,
                        post_number = excluded.post_number,
                        username = excluded.username,
                        author_name = excluded.author_name,
                        created_at = excluded.created_at,
                        updated_at = excluded.updated_at,
                        raw = excluded.raw,
                        cooked = excluded.cooked,
                        reply_count = excluded.reply_count,
                        quote_count = excluded.quote_count,
                        reads = excluded.reads,
                        score = excluded.score,
                        reply_to_post_number = excluded.reply_to_post_number,
                        user_title = excluded.user_title,
                        trust_level = excluded.trust_level,
                        raw_json = excluded.raw_json
                    """,
                    (
                        post.id,
                        topic.topic_id,
                        post.post_number,
                        post.username,
                        post.author_name,
                        post.created_at,
                        post.updated_at,
                        post.raw,
                        post.cooked,
                        post.reply_count,
                        post.quote_count,
                        post.reads,
                        post.score,
                        post.reply_to_post_number,
                        post.user_title,
                        post.trust_level,
                        "{}",
                    ),
                )

    def upsert_profile(
        self,
        profile: Any,
        *,
        topic_id: int | None = None,
        raw: dict[str, Any] | None = None,
    ) -> None:
        now = time.time()
        username_key = str(profile.username).casefold()
        with self.connect() as connection:
            connection.execute(
                """
                insert into discourse_profiles (
                    username_key, username, name, user_id, avatar_template,
                    primary_group_name, trust_level, admin, moderator, raw_json, fetched_epoch
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(username_key) do update set
                    username = excluded.username,
                    name = coalesce(excluded.name, discourse_profiles.name),
                    user_id = coalesce(excluded.user_id, discourse_profiles.user_id),
                    avatar_template = coalesce(excluded.avatar_template, discourse_profiles.avatar_template),
                    primary_group_name = coalesce(excluded.primary_group_name, discourse_profiles.primary_group_name),
                    trust_level = coalesce(excluded.trust_level, discourse_profiles.trust_level),
                    admin = excluded.admin,
                    moderator = excluded.moderator,
                    raw_json = excluded.raw_json,
                    fetched_epoch = excluded.fetched_epoch
                """,
                (
                    username_key,
                    profile.username,
                    profile.name,
                    profile.user_id,
                    profile.avatar_template,
                    profile.primary_group_name,
                    profile.trust_level,
                    int(profile.admin),
                    int(profile.moderator),
                    json.dumps(raw or profile.to_dict(), ensure_ascii=False),
                    now,
                ),
            )
            if topic_id is not None:
                connection.execute(
                    """
                    insert or ignore into discourse_profile_topics (username_key, topic_id)
                    values (?, ?)
                    """,
                    (username_key, topic_id),
                )

    def profile_row(self, username: str) -> sqlite3.Row | None:
        with self.connect() as connection:
            return connection.execute(
                """
                select username, name, user_id, avatar_template, primary_group_name,
                       trust_level, admin, moderator, fetched_epoch
                from discourse_profiles
                where username_key = ?
                """,
                (username.casefold(),),
            ).fetchone()

    def profile_rows(self) -> list[sqlite3.Row]:
        with self.connect() as connection:
            return list(
                connection.execute(
                    """
                    select username, name, user_id, avatar_template, primary_group_name,
                           trust_level, admin, moderator, fetched_epoch
                    from discourse_profiles
                    """
                )
            )

    def stale_usernames(self, usernames: Iterable[str], *, ttl_seconds: int) -> list[str]:
        now = time.time()
        stale: list[str] = []
        with self.connect() as connection:
            for username in usernames:
                row = connection.execute(
                    "select fetched_epoch from discourse_profiles where username_key = ?",
                    (username.casefold(),),
                ).fetchone()
                if row is None or now - float(row["fetched_epoch"] or 0) > ttl_seconds:
                    stale.append(username)
        return stale

    def pep_payload(self, pep: int, *, ttl_seconds: int) -> dict[str, Any] | None:
        now = time.time()
        with self.connect() as connection:
            row = connection.execute(
                """
                select metadata_json from pep_metadata
                where pep = ? and ? - fetched_epoch <= ?
                """,
                (pep, now, ttl_seconds),
            ).fetchone()
        if row is None:
            return None
        payload = json.loads(str(row["metadata_json"]))
        return payload if isinstance(payload, dict) else None

    def upsert_pep_metadata(self, metadata: Any) -> None:
        with self.connect() as connection:
            connection.execute(
                """
                insert into pep_metadata (pep, status, metadata_json, fetched_epoch)
                values (?, ?, ?, ?)
                on conflict(pep) do update set
                    status = excluded.status,
                    metadata_json = excluded.metadata_json,
                    fetched_epoch = excluded.fetched_epoch
                """,
                (
                    metadata.number,
                    metadata.status,
                    json.dumps(metadata.to_dict(), ensure_ascii=False),
                    time.time(),
                ),
            )

    def upsert_topic_document(
        self,
        *,
        topic_id: int,
        schema_version: int,
        source_last_posted_at: str,
        enrichment_fingerprint: str,
        document: dict[str, Any],
    ) -> None:
        with self.connect() as connection:
            connection.execute(
                """
                insert into topic_documents (
                    topic_id, schema_version, source_last_posted_at,
                    enrichment_fingerprint, document_json, fetched_epoch
                )
                values (?, ?, ?, ?, ?, ?)
                on conflict(topic_id) do update set
                    schema_version = excluded.schema_version,
                    source_last_posted_at = excluded.source_last_posted_at,
                    enrichment_fingerprint = excluded.enrichment_fingerprint,
                    document_json = excluded.document_json,
                    fetched_epoch = excluded.fetched_epoch
                """,
                (
                    topic_id,
                    schema_version,
                    source_last_posted_at,
                    enrichment_fingerprint,
                    json.dumps(document, ensure_ascii=False),
                    time.time(),
                ),
            )

    def upsert_topic_export(
        self,
        *,
        topic_id: int,
        export_format: str,
        basename: str,
        content: str,
    ) -> None:
        with self.connect() as connection:
            connection.execute(
                """
                insert into topic_exports (topic_id, format, basename, content, created_epoch)
                values (?, ?, ?, ?, ?)
                on conflict(topic_id, format, basename) do update set
                    content = excluded.content,
                    created_epoch = excluded.created_epoch
                """,
                (topic_id, export_format, basename, content, time.time()),
            )

    def _migrate(self) -> None:
        self.migrate()

    def migrate(self) -> list[MigrationFile]:
        """Apply all pending numbered migrations and return the files applied."""
        migrations = load_migration_files()
        with self.connect() as connection:
            connection.execute(
                """
                create table if not exists schema_migrations (
                    id integer primary key,
                    name text not null,
                    checksum text not null,
                    applied_at text not null
                )
                """
            )
            self._normalize_embedded_migration_records(connection, migrations)
            applied = {
                int(row["id"]): (str(row["name"]), str(row["checksum"]))
                for row in connection.execute("select id, name, checksum from schema_migrations")
            }
            applied_files: list[MigrationFile] = []
            for migration in migrations:
                existing = applied.get(migration.number)
                if existing is not None:
                    existing_name, existing_checksum = existing
                    if existing_name != migration.name:
                        raise RuntimeError(
                            "Migration name mismatch for "
                            f"{migration.number:04d}: applied {existing_name!r}, "
                            f"file is {migration.name!r}"
                        )
                    if existing_checksum != migration.checksum:
                        raise RuntimeError(
                            "Migration checksum mismatch for "
                            f"{migration.number:04d}_{migration.name}"
                        )
                    continue
                migration.migrate(self, connection)
                connection.execute(
                    """
                    insert into schema_migrations (id, name, checksum, applied_at)
                    values (?, ?, ?, datetime('now'))
                    """,
                    (migration.number, migration.name, migration.checksum),
                )
                applied_files.append(migration)
            return applied_files

    @staticmethod
    def _normalize_embedded_migration_records(
        connection: sqlite3.Connection,
        migrations: list[MigrationFile],
    ) -> None:
        rows = list(
            connection.execute(
                "select id, name from schema_migrations order by id"
            )
        )
        old_names = [
            "initial_store",
            "import_people_cache",
            "import_topic_json_cache",
            "import_pep_json_cache",
        ]
        if [int(row["id"]) for row in rows] != [1, 2, 3, 4]:
            return
        if [str(row["name"]) for row in rows] != old_names:
            return
        if len(migrations) < 4:
            return
        if [migration.name for migration in migrations[:4]] != old_names:
            return
        connection.execute("delete from schema_migrations")
        for migration in migrations[:4]:
            connection.execute(
                """
                insert into schema_migrations (id, name, checksum, applied_at)
                values (?, ?, ?, datetime('now'))
                """,
                (migration.number, migration.name, migration.checksum),
            )

    @staticmethod
    def _delete_expired_cache_rows(connection: sqlite3.Connection, *, now: float) -> None:
        connection.execute("delete from discourse_http_cache where expires_epoch <= ?", (now,))
        connection.execute("delete from api_cache_entries where expires_epoch <= ?", (now,))


def default_store() -> KirigamiStore:
    """Return the default configured store and apply migrations."""
    cache_dir = Path(os.environ.get("KIRIGAMI_DISCOURSE_CACHE_DIR", ".cache/kirigami/discourse"))
    return KirigamiStore.from_cache_dir(cache_dir)


def migrate_default_store() -> list[MigrationFile]:
    """Apply migrations to the default configured store."""
    cache_dir = Path(os.environ.get("KIRIGAMI_DISCOURSE_CACHE_DIR", ".cache/kirigami/discourse"))
    configured = os.environ.get("KIRIGAMI_DB_PATH")
    db_path = Path(configured) if configured else cache_dir / "kirigami.sqlite"
    store = KirigamiStore(db_path, legacy_cache_dir=cache_dir, apply_migrations=False)
    return store.migrate()


def load_migration_files(migrations_dir: Path | None = None) -> list[MigrationFile]:
    """Load numbered Django-style migration files and validate ordering."""
    directory = migrations_dir or Path(__file__).parent / "migrations"
    pattern = re.compile(r"^(\d{4})_([a-z0-9_]+)\.py$")
    by_number: dict[int, MigrationFile] = {}
    names: set[str] = set()

    for path in sorted(directory.glob("*.py")):
        if path.name == "__init__.py":
            continue
        match = pattern.match(path.name)
        if match is None:
            raise RuntimeError(
                f"Migration file {path.name!r} must match NNNN_name.py"
            )
        number = int(match.group(1))
        name = match.group(2)
        existing = by_number.get(number)
        if existing is not None:
            raise RuntimeError(
                f"Conflicting migration number {number:04d}: "
                f"{existing.path.name!r} and {path.name!r}"
            )
        if name in names:
            raise RuntimeError(f"Duplicate migration name {name!r}")
        by_number[number] = MigrationFile(number=number, name=name, path=path)
        names.add(name)

    if not by_number:
        raise RuntimeError(f"No migrations found in {directory}")

    numbers = sorted(by_number)
    expected = list(range(numbers[-1] + 1))
    if numbers != expected:
        missing = sorted(set(expected) - set(numbers))
        formatted = ", ".join(f"{number:04d}" for number in missing)
        raise RuntimeError(f"Migration sequence has gaps; missing {formatted}")

    return [by_number[number] for number in numbers]


def _import_people_cache(store: KirigamiStore, connection: sqlite3.Connection) -> None:
    legacy_dir = store.legacy_cache_dir
    if legacy_dir is None:
        return
    legacy_path = legacy_dir / "people.sqlite"
    if not legacy_path.is_file() or legacy_path.resolve() == store.path.resolve():
        return
    try:
        legacy = sqlite3.connect(legacy_path)
        rows = legacy.execute(
            """
            select username_key, username, name, user_id, avatar_template,
                   primary_group_name, trust_level, admin, moderator,
                   seen_in_topic_ids, raw_json, fetched_epoch
            from profiles
            """
        ).fetchall()
    except sqlite3.Error:
        return
    finally:
        try:
            legacy.close()
        except UnboundLocalError:
            pass
    for row in rows:
        connection.execute(
            """
            insert or ignore into discourse_profiles (
                username_key, username, name, user_id, avatar_template,
                primary_group_name, trust_level, admin, moderator, raw_json, fetched_epoch
            )
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[10], row[11]),
        )
        try:
            topic_ids = json.loads(row[9] or "[]")
        except json.JSONDecodeError:
            topic_ids = []
        for topic_id in topic_ids:
            connection.execute(
                """
                insert or ignore into discourse_profile_topics (username_key, topic_id)
                values (?, ?)
                """,
                (row[0], int(topic_id)),
            )


def _import_topic_json_cache(store: KirigamiStore, connection: sqlite3.Connection) -> None:
    legacy_dir = store.legacy_cache_dir
    if legacy_dir is None or not legacy_dir.is_dir():
        return
    for path in sorted(legacy_dir.glob("topic_*.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        topic_id = int(payload["topic_id"])
        connection.execute(
            """
            insert or ignore into discourse_topics (
                topic_id, title, slug, posts_count, last_posted_at, raw_json, fetched_epoch
            )
            values (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                topic_id,
                str(payload.get("title") or ""),
                str(payload.get("slug") or ""),
                int(payload.get("posts_count") or len(payload.get("posts", []))),
                str(payload.get("last_posted_at") or ""),
                json.dumps(payload, ensure_ascii=False),
                time.time(),
            ),
        )
        for post in payload.get("posts", []):
            if not isinstance(post, dict):
                continue
            connection.execute(
                """
                insert or ignore into discourse_posts (
                    post_id, topic_id, post_number, username, author_name, created_at,
                    updated_at, raw, cooked, reply_count, quote_count, reads, score,
                    reply_to_post_number, user_title, trust_level, raw_json
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    int(post["id"]),
                    topic_id,
                    int(post["post_number"]),
                    str(post["username"]),
                    post.get("author_name"),
                    str(post.get("created_at") or ""),
                    str(post.get("updated_at") or ""),
                    str(post.get("raw") or ""),
                    str(post.get("cooked") or ""),
                    int(post.get("reply_count") or 0),
                    int(post.get("quote_count") or 0),
                    int(post.get("reads") or 0),
                    float(post.get("score") or 0.0),
                    post.get("reply_to_post_number"),
                    post.get("user_title"),
                    post.get("trust_level"),
                    json.dumps(post, ensure_ascii=False),
                ),
            )


def _import_pep_json_cache(store: KirigamiStore, connection: sqlite3.Connection) -> None:
    legacy_dir = store.legacy_cache_dir
    if legacy_dir is None:
        return
    pep_dir = legacy_dir.parent / "peps"
    if not pep_dir.is_dir():
        return
    for path in sorted(pep_dir.glob("pep-*.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        metadata = payload.get("metadata")
        if not isinstance(metadata, dict) or "number" not in metadata:
            continue
        connection.execute(
            """
            insert or ignore into pep_metadata (pep, status, metadata_json, fetched_epoch)
            values (?, ?, ?, ?)
            """,
            (
                int(metadata["number"]),
                payload.get("status") or metadata.get("status"),
                json.dumps(metadata, ensure_ascii=False),
                float(payload.get("fetched_epoch") or time.time()),
            ),
        )


def _post_payload(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": int(row["post_id"]),
        "post_number": int(row["post_number"]),
        "username": str(row["username"]),
        "author_name": row["author_name"],
        "created_at": str(row["created_at"]),
        "updated_at": str(row["updated_at"]),
        "raw": str(row["raw"]),
        "cooked": str(row["cooked"]),
        "reply_count": int(row["reply_count"]),
        "quote_count": int(row["quote_count"]),
        "reads": int(row["reads"]),
        "score": float(row["score"]),
        "reply_to_post_number": row["reply_to_post_number"],
        "user_title": row["user_title"],
        "trust_level": row["trust_level"],
    }


def _canonical_query_json(params: dict[str, Any] | list[tuple[str, Any]] | None) -> str:
    if params is None:
        items: list[tuple[str, str]] = []
    elif isinstance(params, dict):
        items = []
        for key, value in params.items():
            if isinstance(value, (list, tuple)):
                items.extend((str(key), str(item)) for item in value)
            else:
                items.append((str(key), str(value)))
    else:
        items = [(str(key), str(value)) for key, value in params]
    return json.dumps(sorted(items), separators=(",", ":"))


def _auth_scope(client: httpx.Client) -> str:
    headers = getattr(client, "headers", {})
    if headers.get("User-Api-Key"):
        return "user-api-key"
    if headers.get("Api-Key"):
        username = headers.get("Api-Username", "")
        return f"api-key:{username}"
    return "public"


def _cache_key(base_url: str, method: str, path: str, query_json: str, auth_scope: str) -> str:
    raw = json.dumps(
        {
            "base_url": base_url.rstrip("/"),
            "method": method.upper(),
            "path": path,
            "query": query_json,
            "auth_scope": auth_scope,
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(raw.encode()).hexdigest()
