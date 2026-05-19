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


def _topic() -> TopicPosts:
    return TopicPosts(
        topic_id=123,
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


def test_topic_resolve_accepts_topic_url(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_fetch_topic_posts(topic_id: int, **_kwargs: object) -> TopicPosts:
        assert topic_id == 123
        return _topic()

    monkeypatch.setattr(api_module, "fetch_topic_posts", fake_fetch_topic_posts)
    client = TestClient(app)

    response = client.get("/api/topics/resolve?input=https://discuss.python.org/t/example-topic/123")

    assert response.status_code == 200
    payload = response.json()
    assert payload["topic"]["topic_id"] == 123
    assert payload["topic"]["title"] == "Example topic"


def test_topic_resolve_rejects_non_dpo_url() -> None:
    client = TestClient(app)

    response = client.get("/api/topics/resolve?input=https://example.com/t/topic/123")

    assert response.status_code == 400


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
