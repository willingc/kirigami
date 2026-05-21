"""Create the initial SQLite store schema."""

from __future__ import annotations

import sqlite3
from typing import Any

SQL = """
create table if not exists discourse_http_cache (
    cache_key text primary key,
    base_url text not null,
    method text not null,
    path text not null,
    query_json text not null,
    auth_scope text not null,
    status_code integer not null,
    response_json text not null,
    fetched_epoch real not null,
    expires_epoch real not null
);

create index if not exists idx_discourse_http_cache_expires
on discourse_http_cache (expires_epoch);

create table if not exists discourse_topics (
    topic_id integer primary key,
    title text not null,
    slug text not null,
    posts_count integer not null,
    last_posted_at text not null,
    raw_json text not null default '{}',
    fetched_epoch real not null
);

create table if not exists discourse_posts (
    post_id integer primary key,
    topic_id integer not null references discourse_topics(topic_id) on delete cascade,
    post_number integer not null,
    username text not null,
    author_name text,
    created_at text not null,
    updated_at text not null,
    raw text not null,
    cooked text not null,
    reply_count integer not null,
    quote_count integer not null,
    reads integer not null,
    score real not null,
    reply_to_post_number integer,
    user_title text,
    trust_level integer,
    raw_json text not null default '{}',
    unique(topic_id, post_number)
);

create index if not exists idx_discourse_posts_topic_post_number
on discourse_posts (topic_id, post_number);

create table if not exists discourse_profiles (
    username_key text primary key,
    username text not null,
    name text,
    user_id integer,
    avatar_template text,
    primary_group_name text,
    trust_level integer,
    admin integer not null default 0,
    moderator integer not null default 0,
    raw_json text not null default '{}',
    fetched_epoch real not null
);

create table if not exists discourse_profile_topics (
    username_key text not null references discourse_profiles(username_key) on delete cascade,
    topic_id integer not null,
    primary key (username_key, topic_id)
);

create table if not exists pep_metadata (
    pep integer primary key,
    status text,
    metadata_json text not null,
    fetched_epoch real not null
);

create table if not exists topic_documents (
    topic_id integer primary key,
    schema_version integer not null,
    source_last_posted_at text not null,
    enrichment_fingerprint text not null,
    document_json text not null,
    fetched_epoch real not null
);

create table if not exists topic_exports (
    export_id integer primary key autoincrement,
    topic_id integer not null,
    format text not null,
    basename text not null,
    content text not null,
    created_epoch real not null,
    unique(topic_id, format, basename)
);

create table if not exists api_cache_entries (
    cache_key text primary key,
    payload_json text not null,
    fetched_epoch real not null,
    expires_epoch real not null
);

create index if not exists idx_api_cache_entries_expires
on api_cache_entries (expires_epoch);
"""


def migrate(_store: Any, connection: sqlite3.Connection) -> None:
    connection.executescript(SQL)
