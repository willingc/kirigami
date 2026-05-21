"""Fetch all posts from a Discourse topic on discuss.python.org."""

from __future__ import annotations

import json
import os
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import httpx

from .client import _clean_secret, load_dotenv_file
from .people import PeopleCache
from .resolve import DISCOURSE_BASE_URL
from ..store import KirigamiStore

BATCH_SIZE = 20
DEFAULT_BATCH_DELAY_S = 0.5
MAX_RETRIES = 3
RETRY_STATUS_CODES = frozenset({429, 502, 503, 504})


@dataclass(frozen=True, slots=True)
class DiscoursePost:
    """A single post in a Discourse topic."""

    id: int
    post_number: int
    username: str
    created_at: str
    updated_at: str
    raw: str
    cooked: str
    reply_count: int
    quote_count: int
    reads: int
    score: float
    reply_to_post_number: int | None = None
    user_title: str | None = None
    trust_level: int | None = None
    author_name: str | None = None


@dataclass(frozen=True, slots=True)
class TopicPosts:
    """A Discourse topic and all of its posts."""

    topic_id: int
    title: str
    slug: str
    posts_count: int
    last_posted_at: str
    posts: tuple[DiscoursePost, ...]

    @property
    def url(self) -> str:
        return f"{DISCOURSE_BASE_URL}/t/{self.slug}/{self.topic_id}"


def create_discourse_client(
    base_url: str = DISCOURSE_BASE_URL,
    *,
    api_key: str | None = None,
    api_username: str | None = None,
    load_env: bool = True,
    timeout: float = 30.0,
) -> httpx.Client:
    """
    Build an HTTP client for the Discourse API.

    Reads ``DISCOURSE_API_KEY`` and ``DISCOURSE_USERNAME`` from the environment
    when explicit credentials are not passed. Optionally loads a ``.env`` file
    when python-dotenv is installed.
    """
    if load_env:
        load_dotenv_file()

    key = _clean_secret(api_key if api_key is not None else os.environ.get("DISCOURSE_API_KEY"))
    user = _clean_secret(
        api_username if api_username is not None else os.environ.get("DISCOURSE_USERNAME")
    )

    headers: dict[str, str] = {}
    if key and user:
        headers["Api-Key"] = key
        headers["Api-Username"] = user
    user_key = _clean_secret(os.environ.get("DISCOURSE_USER_API_KEY"))
    if user_key:
        headers = {"User-Api-Key": user_key}

    return httpx.Client(
        base_url=base_url.rstrip("/"),
        headers=headers,
        timeout=timeout,
    )


def fetch_topic_posts(
    topic_id: int,
    *,
    base_url: str = DISCOURSE_BASE_URL,
    client: httpx.Client | None = None,
    include_raw: bool = True,
    batch_delay_s: float = DEFAULT_BATCH_DELAY_S,
    cache_dir: Path | str | None = None,
) -> TopicPosts:
    """
    Fetch every post from a Discourse topic, handling pagination.

    Args:
        topic_id: Discourse topic ID.
        base_url: Discourse instance base URL.
        client: Optional HTTP client (for tests).
        include_raw: Request raw markdown bodies from the API.
        batch_delay_s: Pause between paginated post batch requests.
        cache_dir: When set, read/write the SQLite cache and apply a 5-minute
            Discourse HTTP cache to every network request.

    Returns:
        Topic metadata and posts sorted by post number.
    """
    if topic_id < 1:
        raise ValueError(f"topic_id must be a positive integer, got {topic_id!r}")

    owns_client = client is None
    if owns_client:
        client = create_discourse_client(base_url=base_url, load_env=False)

    try:
        store = KirigamiStore.from_cache_dir(cache_dir) if cache_dir is not None else None
        topic_data = _get_json(client, f"/t/{topic_id}.json", store=store)
        last_posted_at = str(topic_data.get("last_posted_at") or "")
        if cache_dir is not None:
            PeopleCache(Path(cache_dir) / "people.sqlite").upsert_from_discourse_payload(
                topic_data,
                topic_id=topic_id,
            )

        if store is not None:
            cached = _read_cache(store, topic_id, last_posted_at)
            if cached is not None:
                return cached

        posts = _collect_posts(
            client,
            topic_id,
            topic_data,
            include_raw=include_raw,
            batch_delay_s=batch_delay_s,
            cache_dir=Path(cache_dir) if cache_dir is not None else None,
            store=store,
        )
        result = _build_topic_posts(topic_data, posts)

        if store is not None:
            store.upsert_topic(result, raw=topic_data)

        return result
    finally:
        if owns_client:
            client.close()

def _get_json(
    client: httpx.Client,
    path: str,
    params: dict[str, Any] | list[tuple[str, Any]] | None = None,
    *,
    store: KirigamiStore | None = None,
) -> dict[str, Any]:
    if store is not None:
        return store.get_discourse_json(
            client,
            path,
            params=params,
            max_retries=MAX_RETRIES,
            retry_status_codes=RETRY_STATUS_CODES,
        )
    last_response: httpx.Response | None = None
    for attempt in range(MAX_RETRIES):
        response = client.get(path, params=params)
        last_response = response
        if response.status_code in RETRY_STATUS_CODES and attempt < MAX_RETRIES - 1:
            time.sleep(min(0.5 * (2**attempt), 8.0))
            continue
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise TypeError(f"expected JSON object from {path}, got {type(payload).__name__}")
        return payload
    assert last_response is not None
    last_response.raise_for_status()
    raise RuntimeError("unreachable")


def _collect_posts(
    client: httpx.Client,
    topic_id: int,
    topic_data: dict[str, Any],
    *,
    include_raw: bool,
    batch_delay_s: float,
    cache_dir: Path | None,
    store: KirigamiStore | None,
) -> list[DiscoursePost]:
    post_stream = topic_data.get("post_stream") or {}
    stream_ids: list[int] = list(post_stream.get("stream") or [])
    first_batch: list[dict[str, Any]] = list(post_stream.get("posts") or [])

    posts_by_id: dict[int, DiscoursePost] = {}
    users_by_username = _users_by_username(topic_data)
    for post_data in first_batch:
        post = _parse_post(post_data, users_by_username=users_by_username)
        posts_by_id[post.id] = post

    if not stream_ids:
        stream_ids = list(posts_by_id.keys())

    for offset in range(BATCH_SIZE, len(stream_ids), BATCH_SIZE):
        batch_ids = stream_ids[offset : offset + BATCH_SIZE]
        params: list[tuple[str, Any]] = [("post_ids[]", post_id) for post_id in batch_ids]
        if include_raw:
            params.append(("include_raw", 1))

        batch_data = _get_json(
            client,
            f"/t/{topic_id}/posts.json",
            params=params,
            store=store,
        )
        # Batch payloads can include user records on real Discourse instances.
        # Keep those display names for later PEP role matching.
        if cache_dir is not None:
            PeopleCache(cache_dir / "people.sqlite").upsert_from_discourse_payload(
                batch_data,
                topic_id=topic_id,
            )
        batch_posts = (batch_data.get("post_stream") or {}).get("posts") or []
        for post_data in batch_posts:
            post = _parse_post(post_data, users_by_username=users_by_username)
            posts_by_id[post.id] = post

        if batch_delay_s > 0:
            time.sleep(batch_delay_s)

    ordered_ids = stream_ids or sorted(posts_by_id)
    posts = [posts_by_id[post_id] for post_id in ordered_ids if post_id in posts_by_id]
    posts.sort(key=lambda post: post.post_number)
    return posts


def _parse_post(
    post_data: dict[str, Any],
    *,
    users_by_username: dict[str, dict[str, Any]] | None = None,
) -> DiscoursePost:
    reply_to = post_data.get("reply_to_post_number")
    username = str(post_data["username"])
    profile = (users_by_username or {}).get(username.casefold(), {})
    return DiscoursePost(
        id=int(post_data["id"]),
        post_number=int(post_data["post_number"]),
        username=username,
        author_name=(
            str(post_data.get("name")).strip()
            if post_data.get("name")
            else str(profile.get("name")).strip()
            if profile.get("name")
            else None
        ),
        created_at=str(post_data["created_at"]),
        updated_at=str(post_data["updated_at"]),
        raw=str(post_data.get("raw") or ""),
        cooked=str(post_data.get("cooked") or ""),
        reply_count=int(post_data.get("reply_count") or 0),
        quote_count=int(post_data.get("quote_count") or 0),
        reads=int(post_data.get("reads") or 0),
        score=float(post_data.get("score") or 0.0),
        reply_to_post_number=int(reply_to) if reply_to is not None else None,
        user_title=post_data.get("user_title"),
        trust_level=post_data.get("trust_level"),
    )


def _users_by_username(topic_data: dict[str, Any]) -> dict[str, dict[str, Any]]:
    users: dict[str, dict[str, Any]] = {}
    for item in topic_data.get("users") or []:
        if isinstance(item, dict) and item.get("username"):
            users[str(item["username"]).casefold()] = item
    for item in (topic_data.get("details") or {}).get("participants") or []:
        if isinstance(item, dict) and item.get("username"):
            users[str(item["username"]).casefold()] = item
    return users


def _build_topic_posts(topic_data: dict[str, Any], posts: list[DiscoursePost]) -> TopicPosts:
    return TopicPosts(
        topic_id=int(topic_data["id"]),
        title=str(topic_data.get("title") or ""),
        slug=str(topic_data.get("slug") or ""),
        posts_count=int(topic_data.get("posts_count") or len(posts)),
        last_posted_at=str(topic_data.get("last_posted_at") or ""),
        posts=tuple(posts),
    )


def _cache_path(cache_dir: Path, topic_id: int) -> Path:
    return cache_dir / f"topic_{topic_id}.json"


def _read_cache(store: KirigamiStore, topic_id: int, last_posted_at: str) -> TopicPosts | None:
    payload = store.topic_payload(topic_id, last_posted_at)
    if payload is None:
        return None
    posts = tuple(DiscoursePost(**item) for item in payload.get("posts", []))
    return TopicPosts(
        topic_id=int(payload["topic_id"]),
        title=str(payload.get("title") or ""),
        slug=str(payload.get("slug") or ""),
        posts_count=int(payload.get("posts_count") or len(posts)),
        last_posted_at=last_posted_at,
        posts=posts,
    )


def _write_cache(cache_dir: Path, topic: TopicPosts) -> None:
    cache_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "topic_id": topic.topic_id,
        "title": topic.title,
        "slug": topic.slug,
        "posts_count": topic.posts_count,
        "last_posted_at": topic.last_posted_at,
        "posts": [asdict(post) for post in topic.posts],
    }
    path = _cache_path(cache_dir, topic.topic_id)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
