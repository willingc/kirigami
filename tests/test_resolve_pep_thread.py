"""Tests for PEP thread resolution on discuss.python.org."""

from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest

from kirigami.discourse.resolve import (
    DISCOURSE_BASE_URL,
    TopicRef,
    resolve_pep_thread,
)

JSONDATA = Path(__file__).parent / "jsondata"


def _load_fixture(name: str) -> dict:
    return json.loads((JSONDATA / name).read_text(encoding="utf-8"))


def _mock_client(fixture_name: str, *, base_url: str = DISCOURSE_BASE_URL) -> httpx.Client:
    payload = _load_fixture(fixture_name)

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/search.json" and request.url.params.get("q") == "PEP 751":
            return httpx.Response(200, json=payload)
        return httpx.Response(404, json={"error": "not found"})

    return httpx.Client(
        base_url=base_url.rstrip("/"),
        transport=httpx.MockTransport(handler),
    )


class TestResolvePepThread:
    def test_raises_for_invalid_pep_number(self) -> None:
        with pytest.raises(ValueError, match="positive integer"):
            resolve_pep_thread(0)

        with pytest.raises(ValueError, match="positive integer"):
            resolve_pep_thread(-3)

    def test_returns_empty_list_when_no_topics_match(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"topics": []})

        client = httpx.Client(
            base_url=DISCOURSE_BASE_URL,
            transport=httpx.MockTransport(handler),
        )
        assert resolve_pep_thread(751, client=client) == []

    def test_excludes_unrelated_topics(self) -> None:
        client = _mock_client("search_pep_751.json")
        results = resolve_pep_thread(751, client=client)
        topic_ids = {ref.topic_id for ref in results}
        assert 105631 not in topic_ids

    def test_includes_primary_pep_discussion_threads(self) -> None:
        client = _mock_client("search_pep_751.json")
        results = resolve_pep_thread(751, client=client)
        topic_ids = {ref.topic_id for ref in results}
        assert {59173, 69721, 77293} <= topic_ids

    def test_primary_threads_ranked_above_mentions(self) -> None:
        client = _mock_client("search_pep_751.json")
        results = resolve_pep_thread(751, client=client)
        assert results[0].role == "primary"
        assert results[0].topic_id == 59173
        by_id = {ref.topic_id: ref for ref in results}
        assert by_id[89778].role == "related"
        assert results.index(by_id[59173]) < results.index(by_id[89778])

    def test_largest_primary_thread_ranks_first(self) -> None:
        client = _mock_client("search_pep_751.json")
        results = resolve_pep_thread(751, client=client)
        primary = [ref for ref in results if ref.role == "primary"]
        assert primary[0].topic_id == 59173
        assert primary[0].posts_count == 354

    def test_pre_pep_thread_included_with_related_role(self) -> None:
        client = _mock_client("search_pep_751.json")
        results = resolve_pep_thread(751, client=client)
        pre_pep = next((ref for ref in results if ref.topic_id == 99385), None)
        assert pre_pep is not None
        assert pre_pep.role == "related"
        assert "Pre-PEP" in pre_pep.title

    def test_topic_ref_urls(self) -> None:
        client = _mock_client("search_pep_751.json")
        results = resolve_pep_thread(751, client=client)
        ref = next(ref for ref in results if ref.topic_id == 59173)
        assert ref.url == (
            "https://discuss.python.org/t/pep-751-lock-files-again/59173"
        )

    def test_closed_pep_threads_receive_closed_bonus(self) -> None:
        client = _mock_client("search_pep_751.json")
        results = resolve_pep_thread(751, client=client)
        closed_primary = next(ref for ref in results if ref.topic_id == 59173)
        assert closed_primary.closed is True

    def test_search_request_uses_pep_query(self) -> None:
        seen_queries: list[str] = []

        def handler(request: httpx.Request) -> httpx.Response:
            seen_queries.append(request.url.params.get("q", ""))
            return httpx.Response(200, json={"topics": []})

        client = httpx.Client(
            base_url=DISCOURSE_BASE_URL,
            transport=httpx.MockTransport(handler),
        )
        resolve_pep_thread(42, client=client)
        assert seen_queries == ["PEP 42"]

    def test_http_error_propagates(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(503, text="unavailable")

        client = httpx.Client(
            base_url=DISCOURSE_BASE_URL,
            transport=httpx.MockTransport(handler),
        )
        with pytest.raises(httpx.HTTPStatusError):
            resolve_pep_thread(751, client=client)


class TestTopicRef:
    def test_is_frozen_dataclass(self) -> None:
        ref = TopicRef(
            topic_id=1,
            title="PEP 1: Title",
            slug="pep-1-title",
            category_id=35,
            posts_count=10,
            closed=False,
            created_at="2024-01-01T00:00:00.000Z",
            last_posted_at="2024-01-02T00:00:00.000Z",
            role="primary",
            score=1000.0,
            url="https://discuss.python.org/t/pep-1-title/1",
        )
        with pytest.raises(AttributeError):
            ref.title = "other"  # type: ignore[misc]
