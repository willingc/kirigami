"""Normalize and export Discourse topic data for reading and analysis."""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

import httpx

from kirigami.store import KirigamiStore

from .fetch import DiscoursePost, TopicPosts, fetch_topic_posts
from .resolve import DISCOURSE_BASE_URL, TopicRef, resolve_pep_thread

SCHEMA_VERSION = 1
ExportFormat = Literal["json", "md"]


@dataclass(frozen=True, slots=True)
class ExportedTopic:
    """Paths written by :func:`export_topic`."""

    topic_id: int
    json_path: Path | None
    markdown_path: Path | None


def normalize_topic(topic: TopicPosts, *, pep: int | None = None) -> dict[str, Any]:
    """
    Convert a :class:`TopicPosts` into a stable JSON-serializable document.

    The schema is versioned via ``schema_version`` for downstream tools and caches.
    """
    resolved_pep = pep if pep is not None else parse_pep_from_title(topic.title)
    return {
        "schema_version": SCHEMA_VERSION,
        "source": DISCOURSE_BASE_URL,
        "pep": resolved_pep,
        "topic": {
            "topic_id": topic.topic_id,
            "title": topic.title,
            "slug": topic.slug,
            "url": topic.url,
            "posts_count": topic.posts_count,
            "last_posted_at": topic.last_posted_at,
        },
        "posts": [_normalize_post(post) for post in topic.posts],
    }


def parse_pep_from_title(title: str) -> int | None:
    """Extract a PEP number from a topic title, if present."""
    match = re.search(r"\bPEP\s+(0*\d+)\b", title, re.IGNORECASE)
    if not match:
        return None
    return int(match.group(1))


def topic_to_json(topic: TopicPosts, path: Path | str, *, pep: int | None = None) -> Path:
    """Write a normalized topic document as JSON."""
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    payload = normalize_topic(topic, pep=pep)
    output.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return output


def topic_to_markdown(topic: TopicPosts, path: Path | str) -> Path:
    """Write a human-readable markdown export of a topic."""
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render_markdown(topic), encoding="utf-8")
    return output


def render_markdown(topic: TopicPosts) -> str:
    """Render a topic as markdown."""
    lines = [
        f"# {topic.title}",
        "",
        f"- **URL:** {topic.url}",
        f"- **Posts:** {len(topic.posts)}",
        f"- **Last updated:** {topic.last_posted_at}",
        "",
    ]
    for post in topic.posts:
        lines.extend(
            [
                f"## Post {post.post_number} — @{post.username}",
                "",
                f"- **Created:** {post.created_at}",
            ]
        )
        if post.reply_to_post_number is not None:
            lines.append(f"- **In reply to:** post {post.reply_to_post_number}")
        lines.extend(
            [
                f"- **Replies:** {post.reply_count} | **Reads:** {post.reads}",
                "",
                post.raw,
                "",
                "---",
                "",
            ]
        )
    return "\n".join(lines)


def load_topic_json(path: Path | str) -> dict[str, Any]:
    """Load a normalized topic JSON document."""
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise TypeError(f"expected JSON object in {path}")
    if payload.get("schema_version") != SCHEMA_VERSION:
        raise ValueError(
            f"unsupported schema_version {payload.get('schema_version')!r} in {path}"
        )
    return payload


def export_topic(
    topic: TopicPosts,
    output_dir: Path | str,
    *,
    pep: int | None = None,
    formats: tuple[ExportFormat, ...] = ("json", "md"),
    basename: str | None = None,
) -> ExportedTopic:
    """
    Export a topic to ``output_dir`` in the requested formats.

    Default filenames: ``pep-{pep}-{slug}.json`` / ``.md``, or ``topic-{id}`` when
    no PEP number is known.
    """
    directory = Path(output_dir)
    directory.mkdir(parents=True, exist_ok=True)
    stem = basename or _default_basename(topic, pep=pep)

    json_path: Path | None = None
    markdown_path: Path | None = None

    if "json" in formats:
        json_path = topic_to_json(topic, directory / f"{stem}.json", pep=pep)
    if "md" in formats:
        markdown_path = topic_to_markdown(topic, directory / f"{stem}.md")

    store = _default_store()
    if json_path is not None:
        store.upsert_topic_export(
            topic_id=topic.topic_id,
            export_format="json",
            basename=stem,
            content=json_path.read_text(encoding="utf-8"),
        )
    if markdown_path is not None:
        store.upsert_topic_export(
            topic_id=topic.topic_id,
            export_format="md",
            basename=stem,
            content=markdown_path.read_text(encoding="utf-8"),
        )

    return ExportedTopic(
        topic_id=topic.topic_id,
        json_path=json_path,
        markdown_path=markdown_path,
    )


def export_pep_discussion(
    pep: int,
    output_dir: Path | str,
    *,
    topic_index: int = 0,
    formats: tuple[ExportFormat, ...] = ("json", "md"),
    client: httpx.Client | None = None,
    cache_dir: Path | str | None = None,
) -> tuple[TopicRef, TopicPosts, ExportedTopic]:
    """
    Resolve, fetch, and export the primary discussion thread for a PEP.

    Args:
        pep: PEP number.
        output_dir: Directory for exported files.
        topic_index: Index into :func:`resolve_pep_thread` results (0 = best match).
        formats: ``"json"``, ``"md"``, or both.
        client: Optional shared HTTP client.
        cache_dir: Optional fetch cache directory.

    Returns:
        The resolved topic reference, fetched posts, and output paths.
    """
    refs = resolve_pep_thread(pep, client=client)
    if not refs:
        raise LookupError(f"No discuss.python.org topics found for PEP {pep}")
    if topic_index < 0 or topic_index >= len(refs):
        raise IndexError(
            f"topic_index {topic_index} out of range for PEP {pep} ({len(refs)} topics)"
        )

    ref = refs[topic_index]
    topic = fetch_topic_posts(
        ref.topic_id,
        client=client,
        cache_dir=cache_dir,
    )
    exported = export_topic(
        topic,
        output_dir,
        pep=pep,
        formats=formats,
    )
    return ref, topic, exported


def _normalize_post(post: DiscoursePost) -> dict[str, Any]:
    return {
        "id": post.id,
        "post_number": post.post_number,
        "username": post.username,
        "author_name": post.author_name,
        "created_at": post.created_at,
        "updated_at": post.updated_at,
        "raw": post.raw,
        "reply_to_post_number": post.reply_to_post_number,
        "reply_count": post.reply_count,
        "quote_count": post.quote_count,
        "reads": post.reads,
        "score": post.score,
        "user_title": post.user_title,
        "trust_level": post.trust_level,
    }


def _default_basename(topic: TopicPosts, *, pep: int | None) -> str:
    if pep is not None:
        prefix = f"pep-{pep}"
        if topic.slug == prefix or topic.slug.startswith(f"{prefix}-"):
            return topic.slug
        return f"{prefix}-{topic.slug}"
    return f"topic-{topic.topic_id}-{topic.slug}"


def _default_store() -> KirigamiStore:
    cache_dir = Path(os.environ.get("KIRIGAMI_DISCOURSE_CACHE_DIR", ".cache/kirigami/discourse"))
    return KirigamiStore.from_cache_dir(cache_dir)
