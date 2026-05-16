"""Discourse integration for discuss.python.org."""

from .fetch import DiscoursePost, TopicPosts, create_discourse_client, fetch_topic_posts
from .resolve import TopicRef, resolve_pep_thread

__all__ = [
    "DiscoursePost",
    "TopicPosts",
    "TopicRef",
    "create_discourse_client",
    "fetch_topic_posts",
    "resolve_pep_thread",
]
