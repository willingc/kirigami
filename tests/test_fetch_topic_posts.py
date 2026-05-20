"""Tests for fetching Discourse topic posts."""

from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest

import kirigami.store as store_module
from kirigami.discourse.fetch import (
    DISCOURSE_BASE_URL,
    TopicPosts,
    create_discourse_client,
    fetch_topic_posts,
)

JSONDATA = Path(__file__).parent / "jsondata"


def _load_fixture(name: str) -> dict:
    return json.loads((JSONDATA / name).read_text(encoding="utf-8"))


def _topic_handler(topic_fixture: str, batch_fixture: str | None = None):
    topic_payload = _load_fixture(topic_fixture)
    batch_payload = _load_fixture(batch_fixture) if batch_fixture else None
    batch_requests: list[list[int]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == f"/t/{topic_payload['id']}.json":
            return httpx.Response(200, json=topic_payload)
        if batch_payload and request.url.path == f"/t/{topic_payload['id']}/posts.json":
            requested_ids = [
                int(value)
                for key, value in request.url.params.multi_items()
                if key == "post_ids[]"
            ]
            batch_requests.append(requested_ids)
            return httpx.Response(200, json=batch_payload)
        return httpx.Response(404, json={"error": "not found"})

    handler.batch_requests = batch_requests  # type: ignore[attr-defined]
    return handler


class TestFetchTopicPosts:
    def test_raises_for_invalid_topic_id(self) -> None:
        with pytest.raises(ValueError, match="positive integer"):
            fetch_topic_posts(0)

    def test_fetches_small_topic_in_one_request(self) -> None:
        handler = _topic_handler("topic_small.json")
        client = httpx.Client(
            base_url=DISCOURSE_BASE_URL,
            transport=httpx.MockTransport(handler),
        )
        topic = fetch_topic_posts(100, client=client, batch_delay_s=0)

        assert topic.topic_id == 100
        assert topic.title == "PEP 999: Example thread"
        assert topic.slug == "pep-999-example-thread"
        assert len(topic.posts) == 3
        assert topic.posts[0].post_number == 1
        assert topic.posts[0].raw == "Opening post for PEP 999."
        assert topic.posts[1].reply_to_post_number == 1
        assert topic.url.endswith("/t/pep-999-example-thread/100")

    def test_fetches_paginated_topic_in_two_requests(self) -> None:
        handler = _topic_handler("topic_paginated.json", "topic_paginated_batch2.json")
        client = httpx.Client(
            base_url=DISCOURSE_BASE_URL,
            transport=httpx.MockTransport(handler),
        )
        topic = fetch_topic_posts(200, client=client, batch_delay_s=0)

        assert len(topic.posts) == 25
        assert topic.posts[0].id == 2001
        assert topic.posts[-1].id == 2025
        assert topic.posts[-1].raw == "Post 25"
        assert handler.batch_requests == [[2021, 2022, 2023, 2024, 2025]]  # type: ignore[attr-defined]

    def test_posts_sorted_by_post_number(self) -> None:
        handler = _topic_handler("topic_small.json")
        client = httpx.Client(
            base_url=DISCOURSE_BASE_URL,
            transport=httpx.MockTransport(handler),
        )
        topic = fetch_topic_posts(100, client=client, batch_delay_s=0)
        numbers = [post.post_number for post in topic.posts]
        assert numbers == sorted(numbers)

    def test_cache_skips_post_batch_requests(self, tmp_path: Path) -> None:
        handler = _topic_handler("topic_paginated.json", "topic_paginated_batch2.json")
        client = httpx.Client(
            base_url=DISCOURSE_BASE_URL,
            transport=httpx.MockTransport(handler),
        )

        first = fetch_topic_posts(200, client=client, batch_delay_s=0, cache_dir=tmp_path)
        assert len(first.posts) == 25
        assert len(handler.batch_requests) == 1  # type: ignore[attr-defined]

        second = fetch_topic_posts(200, client=client, batch_delay_s=0, cache_dir=tmp_path)
        assert len(second.posts) == 25
        assert len(handler.batch_requests) == 1  # type: ignore[attr-defined]
        assert second.posts[0].raw == "Post 1"

    def test_cache_rechecks_topic_after_discourse_http_ttl(
        self,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        topic_payload = _load_fixture("topic_small.json")
        call_count = {"n": 0}
        clock = {"now": 1_000.0}
        monkeypatch.setattr(store_module.time, "time", lambda: clock["now"])

        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/t/100.json":
                call_count["n"] += 1
                payload = dict(topic_payload)
                if call_count["n"] > 1:
                    payload = {
                        **payload,
                        "last_posted_at": "2024-01-04T12:00:00.000Z",
                        "post_stream": {
                            **payload["post_stream"],
                            "stream": [1001, 1002, 1003, 1004],
                            "posts": [
                                *payload["post_stream"]["posts"],
                                {
                                    "id": 1004,
                                    "post_number": 4,
                                    "username": "newbie",
                                    "created_at": "2024-01-04T12:00:00.000Z",
                                    "updated_at": "2024-01-04T12:00:00.000Z",
                                    "raw": "New reply.",
                                    "cooked": "",
                                    "reply_count": 0,
                                    "quote_count": 0,
                                    "reads": 1,
                                    "score": 1.0,
                                },
                            ],
                        },
                    }
                return httpx.Response(200, json=payload)
            return httpx.Response(404)

        client = httpx.Client(
            base_url=DISCOURSE_BASE_URL,
            transport=httpx.MockTransport(handler),
        )

        first = fetch_topic_posts(100, client=client, batch_delay_s=0, cache_dir=tmp_path)
        assert len(first.posts) == 3

        second = fetch_topic_posts(100, client=client, batch_delay_s=0, cache_dir=tmp_path)
        assert len(second.posts) == 3
        assert call_count["n"] == 1

        clock["now"] += store_module.DISCOURSE_HTTP_CACHE_TTL_SECONDS + 1
        third = fetch_topic_posts(100, client=client, batch_delay_s=0, cache_dir=tmp_path)
        assert len(third.posts) == 4
        assert third.posts[-1].raw == "New reply."

    def test_http_error_propagates(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(503, text="unavailable")

        client = httpx.Client(
            base_url=DISCOURSE_BASE_URL,
            transport=httpx.MockTransport(handler),
        )
        with pytest.raises(httpx.HTTPStatusError):
            fetch_topic_posts(100, client=client)


class TestCreateDiscourseClient:
    def test_adds_api_headers_from_arguments(self) -> None:
        client = create_discourse_client(
            api_key="secret",
            api_username="me",
            load_env=False,
        )
        try:
            assert client.headers["Api-Key"] == "secret"
            assert client.headers["Api-Username"] == "me"
        finally:
            client.close()

    def test_adds_api_headers_from_environment(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("DISCOURSE_API_KEY", "env-key")
        monkeypatch.setenv("DISCOURSE_USERNAME", "env-user")
        client = create_discourse_client(load_env=False)
        try:
            assert client.headers["Api-Key"] == "env-key"
            assert client.headers["Api-Username"] == "env-user"
        finally:
            client.close()

    def test_no_auth_headers_without_credentials(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("DISCOURSE_API_KEY", raising=False)
        monkeypatch.delenv("DISCOURSE_USERNAME", raising=False)
        monkeypatch.delenv("DISCOURSE_USER_API_KEY", raising=False)
        client = create_discourse_client(load_env=False)
        try:
            assert "Api-Key" not in client.headers
        finally:
            client.close()

    def test_adds_user_api_key_header(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("DISCOURSE_API_KEY", "admin-key")
        monkeypatch.setenv("DISCOURSE_USERNAME", "me")
        monkeypatch.setenv("DISCOURSE_USER_API_KEY", "user-key")
        client = create_discourse_client(load_env=False)
        try:
            assert client.headers["User-Api-Key"] == "user-key"
            assert "Api-Key" not in client.headers
        finally:
            client.close()

    def test_ignores_placeholder_credentials(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("DISCOURSE_API_KEY", "your_api_key_here")
        monkeypatch.setenv("DISCOURSE_USERNAME", "your_discourse_username")
        monkeypatch.delenv("DISCOURSE_USER_API_KEY", raising=False)
        client = create_discourse_client(load_env=False)
        try:
            assert "Api-Key" not in client.headers
            assert "Api-Username" not in client.headers
        finally:
            client.close()


class TestTopicPosts:
    def test_is_frozen_dataclass(self) -> None:
        topic = TopicPosts(
            topic_id=1,
            title="t",
            slug="s",
            posts_count=0,
            last_posted_at="",
            posts=(),
        )
        with pytest.raises(AttributeError):
            topic.title = "other"  # type: ignore[misc]
