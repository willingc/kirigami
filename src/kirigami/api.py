"""HTTP API for the Kirigami web template."""

from __future__ import annotations

import html
import json
import os
import re
from collections import Counter
from dataclasses import asdict
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .discourse.export import normalize_topic
from .discourse.fetch import DiscoursePost, fetch_topic_posts
from .discourse.resolve import resolve_pep_thread

DEFAULT_SAMPLE_TOPIC_ID = 102383
SAMPLE_TOPIC_TITLE = "Wheel Variants discussion"
SAMPLE_TOPIC_URL = f"https://discuss.python.org/t/{DEFAULT_SAMPLE_TOPIC_ID}"
SAMPLE_DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "topic_102383_posts.json"


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

    @app.get("/api/sample-topic")
    def sample_topic(
        limit: int = Query(default=8, ge=1, le=50),
    ) -> dict[str, Any]:
        posts = _load_sample_posts()
        return _summarize_post_dicts(
            posts,
            topic={
                "topic_id": DEFAULT_SAMPLE_TOPIC_ID,
                "title": SAMPLE_TOPIC_TITLE,
                "url": SAMPLE_TOPIC_URL,
            },
            limit=limit,
        )

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


def _load_sample_posts() -> list[dict[str, Any]]:
    if not SAMPLE_DATA_PATH.exists():
        raise HTTPException(status_code=404, detail="Sample topic data was not found.")

    payload = json.loads(SAMPLE_DATA_PATH.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise HTTPException(status_code=500, detail="Sample topic data is malformed.")

    posts = [post for post in payload if isinstance(post, dict)]
    if not posts:
        raise HTTPException(status_code=500, detail="Sample topic data is empty.")
    return posts


def _summarize_post_dicts(
    posts: list[dict[str, Any]],
    *,
    topic: dict[str, Any],
    limit: int,
) -> dict[str, Any]:
    usernames = [str(post.get("username") or "unknown") for post in posts]
    last_updated = max((str(post.get("updated_at") or "") for post in posts), default="")
    reply_total = sum(int(post.get("reply_count") or 0) for post in posts)
    read_total = sum(int(post.get("reads") or 0) for post in posts)

    return {
        "topic": {
            **topic,
            "posts_count": len(posts),
            "last_posted_at": last_updated,
        },
        "metrics": {
            "posts": len(posts),
            "participants": len(set(usernames)),
            "replies": reply_total,
            "reads": read_total,
        },
        "participants": _top_participants(usernames),
        "posts": [
            {
                "id": int(post.get("id") or 0),
                "post_number": int(post.get("post_number") or 0),
                "username": str(post.get("username") or "unknown"),
                "created_at": str(post.get("created_at") or ""),
                "excerpt": _excerpt(str(post.get("raw") or post.get("cooked") or "")),
            }
            for post in posts[:limit]
        ],
    }


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
