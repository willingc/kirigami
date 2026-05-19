"""HTTP API for the Kirigami web template."""

from __future__ import annotations

import html
import os
import re
from collections import Counter
from dataclasses import asdict
from importlib.metadata import PackageNotFoundError, version
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .discourse.client import create_pydiscourse_client, load_discourse_settings
from .discourse.export import normalize_topic
from .discourse.fetch import DiscoursePost, fetch_topic_posts
from .discourse.resolve import resolve_pep_thread


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
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

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

    @app.get("/api/topics/{topic_id}")
    def topic_by_id(
        topic_id: int,
        limit: int = Query(default=12, ge=1, le=100),
    ) -> dict[str, Any]:
        try:
            topic = fetch_topic_posts(topic_id, batch_delay_s=0)
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
        try:
            refs = resolve_pep_thread(pep)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        if not refs:
            raise HTTPException(status_code=404, detail=f"No Discourse topic found for PEP {pep}.")

        result = topic_by_id(refs[0].topic_id, limit=limit)
        result["resolved"] = asdict(refs[0])
        return result

    return app


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

    for part in reversed(parts[1:]):
        if part.isdecimal():
            topic_id = int(part)
            if topic_id > 0:
                return topic_id

    raise HTTPException(status_code=400, detail="Topic URL did not include a topic ID.")


def _fetch_topic_document(topic_id: int) -> dict[str, Any]:
    settings = load_discourse_settings()
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
            has_auth = bool(settings.user_api_key or (settings.api_key and settings.api_username))
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

    return _reader_document(topic)


def _reader_document(topic: Any) -> dict[str, Any]:
    document = normalize_topic(topic)
    document["posts"] = [
        {
            **post,
            "cooked": source_post.cooked,
        }
        for post, source_post in zip(document["posts"], topic.posts, strict=True)
    ]
    return document


def _package_version() -> str:
    try:
        return version("kirigami")
    except PackageNotFoundError:
        from .__about__ import __version__

        return __version__


def _cors_origins() -> list[str]:
    raw = os.environ.get(
        "KIRIGAMI_CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


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
