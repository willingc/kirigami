"""HTTP API for the Kirigami web template."""

from __future__ import annotations

import html
import os
import pathlib
import re
import time
from collections import Counter
from dataclasses import asdict
from datetime import datetime, timezone
from importlib.metadata import PackageNotFoundError, version
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .discourse.client import (
    DiscourseSettings,
    create_httpx_discourse_client,
    create_pydiscourse_client,
    load_discourse_settings,
)
from .discourse.export import normalize_topic
from .discourse.fetch import DiscoursePost, fetch_topic_posts
from .discourse.people import (
    DiscourseUserProfile,
    PeopleCache,
    fetch_and_cache_profiles,
    load_aliases,
    match_pep_people_to_discourse_users,
    roles_for_username,
)
from .discourse.resolve import resolve_pep_thread
from .pep import PepMetadata, fetch_pep_metadata
from .store import API_CACHE_TTL_SECONDS, KirigamiStore
from .thread_analysis import (
    ANALYSIS_VERSION,
    analyze_conversation_document,
    analyze_thread_document,
)

def create_app() -> FastAPI:
    """Create the FastAPI application."""
    app = FastAPI(
        title="Kirigami API",
        summary="Backend API for the Kirigami Next.js template.",
        version=_package_version(),
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins(),
        allow_origin_regex=_cors_origin_regex(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if not STATIC_DIR.exists():
        @app.get("/")
        def root() -> dict[str, str]:
            return {
                "service": "kirigami-api",
                "docs": "/docs",
                "health": "/api/health",
            }

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {
            "status": "ok",
            "service": "kirigami-api",
            "version": _package_version(),
        }

    @app.get("/api/topics/resolve")
    def resolve_topic(
        input: str = Query(min_length=1),  # noqa: A002 - API query parameter name.
    ) -> dict[str, Any]:
        topic_id = _parse_topic_input(input)
        topic = _fetch_topic_document(topic_id)
        return {
            "topic": {
                "topic_id": topic["topic"]["topic_id"],
                "title": topic["topic"]["title"],
                "url": topic["topic"]["url"],
                "posts_count": topic["topic"]["posts_count"],
                "last_posted_at": topic["topic"]["last_posted_at"],
            }
        }

    @app.get("/api/topics/recent")
    def recent_topics(limit: int = Query(default=20, ge=1, le=50)) -> dict[str, Any]:
        return _cached_topic_list("recent", limit=limit)

    @app.get("/api/topics/new")
    def new_topics(limit: int = Query(default=20, ge=1, le=50)) -> dict[str, Any]:
        return _cached_topic_list("new", limit=limit)

    @app.get("/api/topics/{topic_id}")
    def topic_by_id(
        topic_id: int,
        limit: int = Query(default=12, ge=1, le=100),
    ) -> dict[str, Any]:
        settings = load_discourse_settings()
        try:
            topic = fetch_topic_posts(
                topic_id,
                base_url=settings.base_url,
                batch_delay_s=0,
                cache_dir=settings.cache_dir,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=f"Discourse returned {exc.response.status_code} for topic {topic_id}.",
            ) from exc
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        normalized = normalize_topic(topic)
        summary = _summarize_discourse_posts(topic.posts, limit=limit)
        summary["topic"] = normalized["topic"]
        return summary

    @app.get("/api/topics/{topic_id}/document")
    def topic_document(topic_id: int) -> dict[str, Any]:
        return _fetch_topic_document(topic_id)

    @app.get("/api/peps/{pep}/topic")
    def topic_by_pep(
        pep: int,
        limit: int = Query(default=12, ge=1, le=100),
    ) -> dict[str, Any]:
        settings = load_discourse_settings()
        try:
            refs = resolve_pep_thread(pep, base_url=settings.base_url, cache_dir=settings.cache_dir)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        if not refs:
            raise HTTPException(status_code=404, detail=f"No Discourse topic found for PEP {pep}.")

        result = topic_by_id(refs[0].topic_id, limit=limit)
        result["resolved"] = asdict(refs[0])
        return result

    _mount_static_frontend(app)
    return app


STATIC_DIR = pathlib.Path(__file__).parent / "static"
TOPIC_FALLBACK_HTML = STATIC_DIR / "topics" / "index.html"


def _mount_static_frontend(app: FastAPI) -> None:
    """Serve the exported Next.js frontend if it has been built into static/."""
    if not STATIC_DIR.exists():
        return

    next_dir = STATIC_DIR / "_next"
    if next_dir.exists():
        app.mount("/_next", StaticFiles(directory=str(next_dir)), name="next-assets")

    index_html = STATIC_DIR / "index.html"

    # Override the JSON `/` root with the SPA shell when the frontend is bundled.
    @app.get("/", include_in_schema=False)
    def _serve_root() -> FileResponse:
        return FileResponse(index_html)

    @app.get("/{full_path:path}", include_in_schema=False)
    def _serve_static(full_path: str) -> FileResponse:
        # Topic detail pages share one client-rendered HTML shell.
        if full_path.startswith("topics/") and TOPIC_FALLBACK_HTML.is_file():
            return FileResponse(TOPIC_FALLBACK_HTML)

        candidate = (STATIC_DIR / full_path).resolve()
        if candidate.is_relative_to(STATIC_DIR):
            if candidate.is_file():
                return FileResponse(candidate)
            html_index = candidate / "index.html"
            if html_index.is_file():
                return FileResponse(html_index)
        return FileResponse(index_html)


def _cached_topic_list(kind: str, *, limit: int) -> dict[str, Any]:
    settings = load_discourse_settings()
    store = KirigamiStore.from_cache_dir(settings.cache_dir)
    cache_key = f"{settings.base_url}:{kind}:{limit}"
    cached = store.get_api_cache(cache_key)
    if cached is not None:
        payload = dict(cached)
        payload["cached"] = True
        return payload

    try:
        payload = _fetch_topic_list(kind, limit=limit, settings=settings, store=store)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Discourse returned {exc.response.status_code} for {kind} topics.",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    cached_at = _utc_now()
    payload["cached"] = False
    payload["cached_at"] = cached_at
    payload["expires_at"] = _utc_from_timestamp(time.time() + API_CACHE_TTL_SECONDS)
    store.set_api_cache(cache_key, dict(payload))
    return payload


def _fetch_topic_list(
    kind: str,
    *,
    limit: int,
    settings: DiscourseSettings,
    store: KirigamiStore,
) -> dict[str, Any]:
    path = "/latest.json" if kind == "recent" else "/new.json"
    with create_httpx_discourse_client(settings) as client:
        payload = store.get_discourse_json(client, path, params={"per_page": limit})
    PeopleCache(settings.cache_dir / "people.sqlite").upsert_from_discourse_payload(payload)

    topics = payload.get("topic_list", {}).get("topics", [])
    return {
        "kind": kind,
        "limit": limit,
        "topics": [
            _normalize_topic_list_item(topic, base_url=settings.base_url)
            for topic in topics[:limit]
            if isinstance(topic, dict)
        ],
    }


def _normalize_topic_list_item(topic: dict[str, Any], *, base_url: str) -> dict[str, Any]:
    topic_id = _int_value(topic.get("id"))
    slug = str(topic.get("slug") or topic_id)
    excerpt = str(topic.get("excerpt") or "")
    title = str(topic.get("title") or topic.get("fancy_title") or f"Topic {topic_id}")
    return {
        "topic_id": topic_id,
        "title": html.unescape(title),
        "slug": slug,
        "url": f"{base_url}/t/{slug}/{topic_id}",
        "posts_count": _int_value(topic.get("posts_count")),
        "reply_count": _int_value(topic.get("reply_count")),
        "views": _int_value(topic.get("views")),
        "like_count": _int_value(topic.get("like_count")),
        "created_at": topic.get("created_at"),
        "last_posted_at": topic.get("last_posted_at"),
        "bumped_at": topic.get("bumped_at"),
        "last_poster_username": topic.get("last_poster_username"),
        "excerpt": _excerpt(excerpt, limit=180) if excerpt else "",
    }


def _int_value(value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _utc_from_timestamp(value: float) -> str:
    return datetime.fromtimestamp(value, timezone.utc).isoformat().replace("+00:00", "Z")


def _parse_topic_input(value: str) -> int:
    raw = value.strip()
    if raw.isdecimal():
        topic_id = int(raw)
        if topic_id > 0:
            return topic_id
        raise HTTPException(status_code=400, detail="Topic ID must be a positive integer.")

    parsed = urlparse(raw)
    if parsed.scheme not in {"http", "https"} or parsed.netloc != "discuss.python.org":
        raise HTTPException(
            status_code=400,
            detail="Enter a discuss.python.org topic URL or numeric topic ID.",
        )

    parts = [part for part in parsed.path.split("/") if part]
    if not parts or parts[0] != "t":
        raise HTTPException(status_code=400, detail="URL must be a discuss.python.org topic URL.")

    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Topic URL did not include a topic ID.")

    if parts[1].isdecimal():
        topic_id_part = parts[1]
    elif len(parts) > 2:
        topic_id_part = parts[2]
    else:
        topic_id_part = ""

    if topic_id_part.isdecimal():
        topic_id = int(topic_id_part)
        if topic_id > 0:
            return topic_id

    raise HTTPException(status_code=400, detail="Topic URL did not include a topic ID.")


def _fetch_topic_document(topic_id: int) -> dict[str, Any]:
    settings = load_discourse_settings()
    store = KirigamiStore.from_cache_dir(settings.cache_dir)
    cache_key = _topic_document_cache_key(settings.base_url, topic_id)
    cached = store.get_api_cache(cache_key)
    if cached is not None:
        if _topic_document_matches(cached, topic_id):
            return cached
        store.clear_cache_key(cache_key)

    warnings: list[str] = []
    try:
        # Build the pydiscourse client from the same credentials when auth is
        # configured, while the existing fetcher handles full post pagination.
        if settings.api_key and settings.api_username:
            create_pydiscourse_client(settings)
        try:
            topic = fetch_topic_posts(
                topic_id,
                base_url=settings.base_url,
                batch_delay_s=0,
                cache_dir=settings.cache_dir,
            )
        except httpx.HTTPStatusError as exc:
            has_auth = bool(settings.api_key and settings.api_username)
            if exc.response.status_code != 403 or not has_auth:
                raise
            with httpx.Client(base_url=settings.base_url, timeout=30.0) as public_client:
                topic = fetch_topic_posts(
                    topic_id,
                    client=public_client,
                    batch_delay_s=0,
                    cache_dir=settings.cache_dir,
                )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Discourse returned {exc.response.status_code} for topic {topic_id}.",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    document = _reader_document(topic, settings=settings, store=store, warnings=warnings)
    if not _topic_document_matches(document, topic_id):
        raise HTTPException(
            status_code=502,
            detail=(
                "Fetched topic document did not match the requested topic "
                f"{topic_id}."
            ),
        )
    store.set_api_cache(cache_key, document)
    return document


def _reader_document(
    topic: Any,
    *,
    settings: DiscourseSettings,
    store: KirigamiStore,
    warnings: list[str],
) -> dict[str, Any]:
    document = normalize_topic(topic)
    pep_metadata = _load_pep_metadata(document.get("pep"), settings=settings, warnings=warnings)
    people_cache = PeopleCache(settings.cache_dir / "people.sqlite")
    for profile in _profiles_from_posts(topic.posts):
        people_cache.upsert_profile(profile, topic_id=topic.topic_id)

    if _refresh_people_profiles_enabled():
        with create_httpx_discourse_client(settings, timeout=8.0) as client:
            warnings.extend(
                fetch_and_cache_profiles(
                    [post.username for post in topic.posts],
                    client=client,
                    cache=people_cache,
                )
            )

    profiles = people_cache.all_profiles()
    aliases = load_aliases(settings.cache_dir / "person-aliases.json")
    role_matches = match_pep_people_to_discourse_users(
        pep_metadata,
        profiles,
        aliases=aliases,
    )
    document["posts"] = [
        {
            **post,
            "cooked": source_post.cooked,
            "author_roles": roles_for_username(role_matches, source_post.username),
        }
        for post, source_post in zip(document["posts"], topic.posts, strict=True)
    ]
    document["pep_metadata"] = pep_metadata.to_dict() if pep_metadata else None
    document["participants"] = [
        profile.to_dict()
        for profile in sorted(
            _profiles_for_topic_posts(profiles, topic.posts),
            key=lambda profile: profile.username.casefold(),
        )
    ]
    document["role_matches"] = [match.to_dict() for match in role_matches]
    document["analysis_warnings"] = warnings
    document["conversation_analysis"] = analyze_conversation_document(document)
    document["thread_analysis"] = analyze_thread_document(document)
    store.upsert_topic_document(
        topic_id=topic.topic_id,
        schema_version=int(document.get("schema_version") or 0),
        source_last_posted_at=topic.last_posted_at,
        enrichment_fingerprint=_document_enrichment_fingerprint(document),
        document=document,
    )
    return document


def _load_pep_metadata(
    pep: Any,
    *,
    settings: DiscourseSettings,
    warnings: list[str],
) -> PepMetadata | None:
    if pep is None:
        return None
    try:
        return fetch_pep_metadata(int(pep), cache_dir=settings.cache_dir)
    except (httpx.HTTPError, ValueError, OSError) as exc:
        warnings.append(f"Could not fetch PEP {pep} metadata: {exc}")
        return None


def _profiles_from_posts(posts: tuple[DiscoursePost, ...]) -> list[DiscourseUserProfile]:
    profiles: list[DiscourseUserProfile] = []
    for post in posts:
        profiles.append(
            DiscourseUserProfile(
                username=post.username,
                name=post.author_name,
                trust_level=post.trust_level,
            )
        )
    return profiles


def _profiles_for_topic_posts(
    profiles: list[DiscourseUserProfile],
    posts: tuple[DiscoursePost, ...],
) -> list[DiscourseUserProfile]:
    usernames = {post.username.casefold() for post in posts}
    return [profile for profile in profiles if profile.username.casefold() in usernames]


def _refresh_people_profiles_enabled() -> bool:
    return os.environ.get("KIRIGAMI_REFRESH_PEOPLE_PROFILES", "").strip().lower() in {
        "1",
        "true",
        "yes",
    }


def _document_enrichment_fingerprint(document: dict[str, Any]) -> str:
    pep = document.get("pep_metadata") or {}
    participants = document.get("participants") or []
    return (
        f"pep:{pep.get('fetched_at', '')}:participants:{len(participants)}:"
        f"thread-analysis:{ANALYSIS_VERSION}"
    )


def _topic_document_cache_key(base_url: str, topic_id: int) -> str:
    return f"{base_url.rstrip('/')}:topic-document:{topic_id}:analysis:{ANALYSIS_VERSION}"


def _topic_document_matches(document: dict[str, Any], topic_id: int) -> bool:
    topic = document.get("topic")
    if not isinstance(topic, dict):
        return False
    try:
        return int(topic.get("topic_id")) == topic_id
    except (TypeError, ValueError):
        return False


def _package_version() -> str:
    try:
        return version("kirigami")
    except PackageNotFoundError:
        from .__about__ import __version__

        return __version__


def _cors_origins() -> list[str]:
    raw = os.environ.get(
        "KIRIGAMI_CORS_ORIGINS",
        ",".join(
            [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "https://localhost",
                "https://127.0.0.1",
            ]
        ),
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def _cors_origin_regex() -> str | None:
    return os.environ.get(
        "KIRIGAMI_CORS_ORIGIN_REGEX",
        r"https://(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+)",
    )


def _summarize_discourse_posts(posts: tuple[DiscoursePost, ...], *, limit: int) -> dict[str, Any]:
    usernames = [post.username for post in posts]
    return {
        "metrics": {
            "posts": len(posts),
            "participants": len(set(usernames)),
            "replies": sum(post.reply_count for post in posts),
            "reads": sum(post.reads for post in posts),
        },
        "participants": _top_participants(usernames),
        "posts": [
            {
                "id": post.id,
                "post_number": post.post_number,
                "username": post.username,
                "created_at": post.created_at,
                "excerpt": _excerpt(post.raw or post.cooked),
            }
            for post in posts[:limit]
        ],
    }


def _top_participants(usernames: list[str]) -> list[dict[str, int | str]]:
    return [
        {"username": username, "posts": count}
        for username, count in Counter(usernames).most_common(8)
    ]


def _excerpt(value: str, *, limit: int = 220) -> str:
    text = re.sub(r"<[^>]+>", " ", value)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    return f"{text[: limit - 1].rstrip()}..."


app = create_app()
