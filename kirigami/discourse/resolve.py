"""Resolve discuss.python.org topic IDs for a PEP number."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

from kirigami.store import KirigamiStore

DISCOURSE_BASE_URL = "https://discuss.python.org"

# Category 19: PEPs (general). Category 35: packaging / PyPA PEP discussions.
PEP_CATEGORY_IDS: frozenset[int] = frozenset({19, 35})

MIN_RELEVANCE_SCORE = 100.0


@dataclass(frozen=True, slots=True)
class TopicRef:
    """A Discourse topic that discusses a PEP."""

    topic_id: int
    title: str
    slug: str
    category_id: int
    posts_count: int
    closed: bool
    created_at: str
    last_posted_at: str
    role: str
    score: float
    url: str


def resolve_pep_thread(
    pep: int,
    *,
    base_url: str = DISCOURSE_BASE_URL,
    client: httpx.Client | None = None,
    pep_category_ids: frozenset[int] | None = None,
    cache_dir: Path | str | None = None,
) -> list[TopicRef]:
    """
    Find Discourse topics on discuss.python.org that discuss a PEP.

    Uses the public search API, filters to relevant topics, and ranks them so
    canonical PEP discussion threads (e.g. ``PEP 751: lock files``) appear first.

    Args:
        pep: PEP number (positive integer).
        base_url: Discourse instance base URL.
        client: Optional HTTP client (for tests). When omitted, a short-lived
            client is created for the request.
        pep_category_ids: Category IDs treated as PEP discussion areas.
        cache_dir: Optional Kirigami cache directory for the 5-minute Discourse
            HTTP cache.

    Returns:
        Matching topics sorted by relevance (highest score first).
    """
    if pep < 1:
        raise ValueError(f"PEP number must be a positive integer, got {pep!r}")

    categories = pep_category_ids if pep_category_ids is not None else PEP_CATEGORY_IDS
    owns_client = client is None
    if owns_client:
        client = httpx.Client(base_url=base_url.rstrip("/"), timeout=30.0)

    try:
        if cache_dir is None:
            response = client.get("/search.json", params={"q": f"PEP {pep}"})
            response.raise_for_status()
            payload = response.json()
        else:
            payload = KirigamiStore.from_cache_dir(cache_dir).get_discourse_json(
                client,
                "/search.json",
                params={"q": f"PEP {pep}"},
            )
    finally:
        if owns_client:
            client.close()

    topics = payload.get("topics") or []
    scored: list[TopicRef] = []
    for topic in topics:
        ref = _score_topic(topic, pep=pep, base_url=base_url, pep_category_ids=categories)
        if ref is not None and ref.score >= MIN_RELEVANCE_SCORE:
            scored.append(ref)

    scored.sort(key=lambda ref: (ref.score, ref.posts_count), reverse=True)
    return scored


def _score_topic(
    topic: dict[str, Any],
    *,
    pep: int,
    base_url: str,
    pep_category_ids: frozenset[int],
) -> TopicRef | None:
    title = topic.get("title") or ""
    slug = topic.get("slug") or ""
    topic_id = topic.get("id")
    if topic_id is None:
        return None

    relevance = _title_relevance(title, slug, pep)
    if relevance is None:
        return None

    role, title_score = relevance
    score = float(title_score)

    category_id = int(topic.get("category_id") or 0)
    if category_id in pep_category_ids:
        score += 100.0

    if re.search(r"\bpre-pep\b", title, re.IGNORECASE):
        score -= 200.0
        if role == "primary":
            role = "related"

    posts_count = int(topic.get("posts_count") or 0)
    score += min(100.0, posts_count / 5.0)

    if topic.get("closed"):
        score += 25.0

    base = base_url.rstrip("/")
    url = f"{base}/t/{slug}/{topic_id}"

    return TopicRef(
        topic_id=int(topic_id),
        title=title,
        slug=slug,
        category_id=category_id,
        posts_count=posts_count,
        closed=bool(topic.get("closed")),
        created_at=str(topic.get("created_at") or ""),
        last_posted_at=str(topic.get("last_posted_at") or ""),
        role=role,
        score=score,
        url=url,
    )


def _title_relevance(title: str, slug: str, pep: int) -> tuple[str, float] | None:
    """Return (role, base_score) if the topic is about this PEP, else None."""
    pep_token = str(pep)
    pep_padded = f"{pep:04d}"

    primary = re.match(
        rf"^PEP\s+(?:0*{re.escape(pep_token)}|{re.escape(pep_padded)})\s*[-–:]",
        title,
        re.IGNORECASE,
    )
    if primary:
        return ("primary", 1000.0)

    slug_prefix = rf"^pep-(?:0*{re.escape(pep_token)}|{re.escape(pep_padded)})(?:-|$)"
    if re.match(slug_prefix, slug, re.IGNORECASE):
        return ("primary", 900.0)

    if re.search(
        rf"\bPEP\s+(?:0*{re.escape(pep_token)}|{re.escape(pep_padded)})\b",
        title,
        re.IGNORECASE,
    ):
        return ("related", 200.0)

    if re.search(rf"\bpep-{re.escape(pep_token)}\b", slug, re.IGNORECASE):
        return ("related", 150.0)

    return None
