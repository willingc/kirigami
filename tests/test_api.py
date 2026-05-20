"""Smoke tests for the optional web API."""

from __future__ import annotations

import httpx
import pytest

pytest.importorskip("fastapi")

from fastapi.testclient import TestClient

import kirigami.api as api_module
from kirigami.api import app
from kirigami.discourse.fetch import DiscoursePost, TopicPosts


def test_health_endpoint() -> None:
    client = TestClient(app)

    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "kirigami-api"


def test_cors_allows_caddy_https_origin() -> None:
    client = TestClient(app)

    response = client.options(
        "/api/health",
        headers={
            "Origin": "https://localhost",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://localhost"


def test_cors_allows_caddy_lan_https_origin() -> None:
    client = TestClient(app)

    response = client.options(
        "/api/health",
        headers={
            "Origin": "https://192.168.1.20",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://192.168.1.20"


def _topic(topic_id: int = 123) -> TopicPosts:
    return TopicPosts(
        topic_id=topic_id,
        title="Example topic",
        slug="example-topic",
        posts_count=1,
        last_posted_at="2024-01-01T12:00:00.000Z",
        posts=(
            DiscoursePost(
                id=1001,
                post_number=1,
                username="alice",
                created_at="2024-01-01T12:00:00.000Z",
                updated_at="2024-01-01T12:00:00.000Z",
                raw="Hello world",
                cooked="<p>Hello world</p>",
                reply_count=0,
                quote_count=0,
                reads=3,
                score=1.0,
            ),
        ),
    )


def test_topic_by_id_summarizes_fetched_topic(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_fetch_topic_posts(topic_id: int, **_kwargs: object) -> TopicPosts:
        assert topic_id == 123
        return _topic()

    monkeypatch.setattr(api_module, "fetch_topic_posts", fake_fetch_topic_posts)
    client = TestClient(app)

    response = client.get("/api/topics/123?limit=1")

    assert response.status_code == 200
    payload = response.json()
    assert payload["topic"]["topic_id"] == 123
    assert payload["metrics"]["posts"] == 1
    assert payload["posts"][0]["post_number"] == 1


@pytest.mark.parametrize(
    "topic_url",
    [
        "https://discuss.python.org/t/pep-766-handling-multiple-indexes-index-priority/71589/7",
        "https://discuss.python.org/t/pep-766-handling-multiple-indexes-index-priority/71589/7/",
        "https://discuss.python.org/t/pep-766-handling-multiple-indexes-index-priority/71589/",
        "https://discuss.python.org/t/pep-766-handling-multiple-indexes-index-priority/71589",
    ],
)
def test_topic_resolve_accepts_topic_url(
    topic_url: str,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fake_fetch_topic_posts(topic_id: int, **_kwargs: object) -> TopicPosts:
        assert topic_id == 71589
        return _topic(topic_id=topic_id)

    monkeypatch.setattr(api_module, "fetch_topic_posts", fake_fetch_topic_posts)
    client = TestClient(app)

    response = client.get("/api/topics/resolve", params={"input": topic_url})

    assert response.status_code == 200
    payload = response.json()
    assert payload["topic"]["topic_id"] == 71589
    assert payload["topic"]["title"] == "Example topic"


def test_topic_resolve_rejects_non_dpo_url() -> None:
    client = TestClient(app)

    response = client.get("/api/topics/resolve?input=https://example.com/t/topic/123")

    assert response.status_code == 400


def test_recent_topics_are_cached(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = {"n": 0}

    class FakeDiscourseClient:
        def __enter__(self) -> "FakeDiscourseClient":
            return self

        def __exit__(self, *_args: object) -> None:
            return None

        def get(self, path: str, *, params: dict[str, int]) -> httpx.Response:
            calls["n"] += 1
            assert path == "/latest.json"
            assert params["per_page"] == 2
            request = httpx.Request("GET", "https://discuss.python.org/latest.json")
            return httpx.Response(
                200,
                json={
                    "topic_list": {
                        "topics": [
                            {
                                "id": 123,
                                "title": "Recent topic",
                                "slug": "recent-topic",
                                "posts_count": 4,
                                "reply_count": 3,
                                "views": 42,
                                "like_count": 7,
                                "created_at": "2024-01-01T12:00:00.000Z",
                                "last_posted_at": "2024-01-02T12:00:00.000Z",
                                "bumped_at": "2024-01-02T12:00:00.000Z",
                                "last_poster_username": "alice",
                            }
                        ]
                    }
                },
                request=request,
            )

    monkeypatch.setattr(
        api_module,
        "create_httpx_discourse_client",
        lambda _settings: FakeDiscourseClient(),
    )
    api_module._topic_list_cache.clear()
    client = TestClient(app)

    first_response = client.get("/api/topics/recent?limit=2")
    second_response = client.get("/api/topics/recent?limit=2")

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert calls["n"] == 1
    first_payload = first_response.json()
    second_payload = second_response.json()
    assert first_payload["cached"] is False
    assert second_payload["cached"] is True
    assert first_payload["topics"][0]["topic_id"] == 123
    assert first_payload["topics"][0]["url"] == "https://discuss.python.org/t/recent-topic/123"


def test_new_topics_use_new_discourse_feed(monkeypatch: pytest.MonkeyPatch) -> None:
    class FakeDiscourseClient:
        def __enter__(self) -> "FakeDiscourseClient":
            return self

        def __exit__(self, *_args: object) -> None:
            return None

        def get(self, path: str, *, params: dict[str, int]) -> httpx.Response:
            assert path == "/new.json"
            assert params["per_page"] == 20
            request = httpx.Request("GET", "https://discuss.python.org/new.json")
            return httpx.Response(
                200,
                json={
                    "topic_list": {
                        "topics": [
                            {
                                "id": 456,
                                "title": "New topic",
                                "slug": "new-topic",
                            }
                        ]
                    }
                },
                request=request,
            )

    monkeypatch.setattr(
        api_module,
        "create_httpx_discourse_client",
        lambda _settings: FakeDiscourseClient(),
    )
    api_module._topic_list_cache.clear()
    client = TestClient(app)

    response = client.get("/api/topics/new")

    assert response.status_code == 200
    payload = response.json()
    assert payload["kind"] == "new"
    assert payload["limit"] == 20
    assert payload["topics"][0]["topic_id"] == 456


def test_topic_document_includes_cooked_html(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_fetch_topic_posts(topic_id: int, **_kwargs: object) -> TopicPosts:
        assert topic_id == 123
        return _topic()

    monkeypatch.setattr(api_module, "fetch_topic_posts", fake_fetch_topic_posts)
    client = TestClient(app)

    response = client.get("/api/topics/123/document")

    assert response.status_code == 200
    payload = response.json()
    assert payload["topic"]["topic_id"] == 123
    assert payload["posts"][0]["raw"] == "Hello world"
    assert payload["posts"][0]["cooked"] == "<p>Hello world</p>"
    assert payload["posts"][0]["author_roles"] == []
    assert payload["pep_metadata"] is None
    assert payload["role_matches"] == []
    assert payload["analysis_warnings"] == []


def test_topic_document_retries_public_fetch_after_auth_403(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls = {"n": 0}

    def fake_fetch_topic_posts(topic_id: int, **kwargs: object) -> TopicPosts:
        calls["n"] += 1
        assert topic_id == 123
        if calls["n"] == 1:
            request = httpx.Request("GET", "https://discuss.python.org/t/123.json")
            response = httpx.Response(403, request=request)
            raise httpx.HTTPStatusError("forbidden", request=request, response=response)
        assert kwargs.get("client") is not None
        return _topic()

    monkeypatch.setattr(api_module, "fetch_topic_posts", fake_fetch_topic_posts)
    monkeypatch.setenv("DISCOURSE_API_KEY", "bad-key")
    monkeypatch.setenv("DISCOURSE_USERNAME", "alice")
    client = TestClient(app)

    response = client.get("/api/topics/123/document")

    assert response.status_code == 200
    assert calls["n"] == 2
