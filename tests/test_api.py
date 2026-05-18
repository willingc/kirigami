"""Smoke tests for the optional web API."""

from __future__ import annotations

import pytest

pytest.importorskip("fastapi")

from fastapi.testclient import TestClient

from kirigami.api import app


def test_health_endpoint() -> None:
    client = TestClient(app)

    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "kirigami-api"


def test_sample_topic_endpoint() -> None:
    client = TestClient(app)

    response = client.get("/api/sample-topic?limit=2")

    assert response.status_code == 200
    payload = response.json()
    assert payload["topic"]["topic_id"] == 102383
    assert payload["metrics"]["posts"] >= 2
    assert len(payload["posts"]) == 2
