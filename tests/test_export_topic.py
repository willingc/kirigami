"""Tests for normalizing and exporting Discourse topics."""

from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest

from kirigami.discourse.export import (
    SCHEMA_VERSION,
    export_pep_discussion,
    export_topic,
    load_topic_json,
    normalize_topic,
    parse_pep_from_title,
    render_markdown,
    topic_to_json,
    topic_to_markdown,
)
from kirigami.discourse.fetch import DiscoursePost, TopicPosts
from kirigami.discourse.resolve import DISCOURSE_BASE_URL

JSONDATA = Path(__file__).parent / "jsondata"


def _sample_topic() -> TopicPosts:
    posts = (
        DiscoursePost(
            id=1001,
            post_number=1,
            username="brettcannon",
            created_at="2024-01-01T12:00:00.000Z",
            updated_at="2024-01-01T12:00:00.000Z",
            raw="Opening post for PEP 999.",
            cooked="",
            reply_count=1,
            quote_count=0,
            reads=10,
            score=1.0,
        ),
        DiscoursePost(
            id=1002,
            post_number=2,
            username="pf_moore",
            created_at="2024-01-02T12:00:00.000Z",
            updated_at="2024-01-02T12:00:00.000Z",
            raw="A thoughtful reply.",
            cooked="",
            reply_count=0,
            quote_count=0,
            reads=5,
            score=0.5,
            reply_to_post_number=1,
        ),
    )
    return TopicPosts(
        topic_id=100,
        title="PEP 999: Example thread",
        slug="pep-999-example-thread",
        posts_count=2,
        last_posted_at="2024-01-02T12:00:00.000Z",
        posts=posts,
    )


class TestNormalizeTopic:
    def test_schema_fields(self) -> None:
        payload = normalize_topic(_sample_topic(), pep=999)
        assert payload["schema_version"] == SCHEMA_VERSION
        assert payload["source"] == DISCOURSE_BASE_URL
        assert payload["pep"] == 999
        assert payload["topic"]["topic_id"] == 100
        assert payload["topic"]["url"].endswith("/t/pep-999-example-thread/100")
        assert len(payload["posts"]) == 2
        assert payload["posts"][1]["reply_to_post_number"] == 1
        assert "cooked" not in payload["posts"][0]

    def test_parse_pep_from_title_when_not_passed(self) -> None:
        payload = normalize_topic(_sample_topic())
        assert payload["pep"] == 999

    def test_parse_pep_from_title_returns_none(self) -> None:
        assert parse_pep_from_title("Random packaging thread") is None
        assert parse_pep_from_title("PEP 0751: Lock files") == 751


class TestExportTopic:
    def test_writes_json_and_markdown(self, tmp_path: Path) -> None:
        topic = _sample_topic()
        exported = export_topic(topic, tmp_path, pep=999)

        assert exported.json_path is not None
        assert exported.markdown_path is not None
        assert exported.json_path.is_file()
        assert exported.markdown_path.is_file()

        loaded = load_topic_json(exported.json_path)
        assert loaded["pep"] == 999
        assert loaded["posts"][0]["raw"] == "Opening post for PEP 999."

        markdown = exported.markdown_path.read_text(encoding="utf-8")
        assert "# PEP 999: Example thread" in markdown
        assert "## Post 1 — @brettcannon" in markdown
        assert "Opening post for PEP 999." in markdown
        assert "**In reply to:** post 1" in markdown

    def test_render_markdown_includes_metadata(self) -> None:
        text = render_markdown(_sample_topic())
        assert "https://discuss.python.org/t/pep-999-example-thread/100" in text

    def test_topic_to_json_and_markdown_paths(self, tmp_path: Path) -> None:
        topic = _sample_topic()
        json_path = topic_to_json(topic, tmp_path / "out.json", pep=999)
        md_path = topic_to_markdown(topic, tmp_path / "out.md")
        assert json.loads(json_path.read_text(encoding="utf-8"))["topic"]["title"]
        assert "Post 2" in md_path.read_text(encoding="utf-8")

    def test_load_topic_json_rejects_unknown_schema(self, tmp_path: Path) -> None:
        path = tmp_path / "bad.json"
        path.write_text(json.dumps({"schema_version": 99}), encoding="utf-8")
        with pytest.raises(ValueError, match="unsupported schema_version"):
            load_topic_json(path)


class TestExportPepDiscussion:
    def test_end_to_end_with_mock_client(self, tmp_path: Path) -> None:
        search_payload = json.loads((JSONDATA / "search_pep_751.json").read_text(encoding="utf-8"))
        topic_payload = json.loads((JSONDATA / "topic_small.json").read_text(encoding="utf-8"))
        topic_payload = {
            **topic_payload,
            "id": 59173,
            "title": "PEP 751: lock files (again)",
            "slug": "pep-751-lock-files-again",
        }
        topic_payload["post_stream"]["posts"][0]["raw"] = "PEP 751 discussion opener."

        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/search.json":
                return httpx.Response(200, json=search_payload)
            if request.url.path == "/t/59173.json":
                return httpx.Response(200, json=topic_payload)
            return httpx.Response(404)

        client = httpx.Client(
            base_url=DISCOURSE_BASE_URL,
            transport=httpx.MockTransport(handler),
        )
        ref, topic, exported = export_pep_discussion(751, tmp_path, client=client)

        assert ref.topic_id == 59173
        assert ref.role == "primary"
        assert len(topic.posts) == 3
        assert exported.json_path is not None
        assert exported.markdown_path is not None
        assert exported.json_path.name == "pep-751-lock-files-again.json"

        loaded = load_topic_json(exported.json_path)
        assert loaded["pep"] == 751

    def test_raises_when_no_topics_found(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"topics": []})

        client = httpx.Client(
            base_url=DISCOURSE_BASE_URL,
            transport=httpx.MockTransport(handler),
        )
        with pytest.raises(LookupError, match="No discuss.python.org topics"):
            export_pep_discussion(751, Path("/tmp/unused"), client=client)
