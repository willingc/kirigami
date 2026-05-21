"""Discourse integration for discuss.python.org."""

from .client import (
    DiscourseSettings,
    create_httpx_discourse_client,
    create_pydiscourse_client,
    load_discourse_settings,
)
from .export import (
    ExportedTopic,
    export_pep_discussion,
    export_topic,
    load_topic_json,
    normalize_topic,
    render_markdown,
    topic_to_json,
    topic_to_markdown,
)
from .fetch import DiscoursePost, TopicPosts, create_discourse_client, fetch_topic_posts
from .resolve import TopicRef, resolve_pep_thread

__all__ = [
    "DiscoursePost",
    "DiscourseSettings",
    "ExportedTopic",
    "TopicPosts",
    "TopicRef",
    "create_httpx_discourse_client",
    "create_pydiscourse_client",
    "create_discourse_client",
    "export_pep_discussion",
    "export_topic",
    "fetch_topic_posts",
    "load_discourse_settings",
    "load_topic_json",
    "normalize_topic",
    "render_markdown",
    "resolve_pep_thread",
    "topic_to_json",
    "topic_to_markdown",
]
