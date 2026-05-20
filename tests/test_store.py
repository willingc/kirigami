from __future__ import annotations

import json
import sqlite3
from pathlib import Path

import httpx
import pytest

import kirigami.store as store_module
from kirigami.store import (
    DISCOURSE_HTTP_CACHE_TTL_SECONDS,
    KirigamiStore,
    load_migration_files,
)


def test_migrations_create_expected_tables_and_rerun_idempotently(tmp_path: Path) -> None:
    store = KirigamiStore.from_cache_dir(tmp_path)
    KirigamiStore.from_cache_dir(tmp_path)

    with store.connect() as connection:
        tables = {
            str(row["name"])
            for row in connection.execute(
                "select name from sqlite_master where type = 'table'"
            )
        }
        migration_rows = list(
            connection.execute("select id, name from schema_migrations order by id")
        )

    assert {
        "schema_migrations",
        "discourse_http_cache",
        "discourse_topics",
        "discourse_posts",
        "discourse_profiles",
        "pep_metadata",
        "topic_documents",
        "topic_exports",
        "api_cache_entries",
    } <= tables
    assert [int(row["id"]) for row in migration_rows] == [0, 1, 2, 3]
    assert [str(row["name"]) for row in migration_rows] == [
        "initial_store",
        "import_people_cache",
        "import_topic_json_cache",
        "import_pep_json_cache",
    ]


def test_migration_checksum_mismatch_fails_loudly(tmp_path: Path) -> None:
    store = KirigamiStore.from_cache_dir(tmp_path)
    with store.connect() as connection:
        connection.execute("update schema_migrations set checksum = 'bad' where id = 0")

    with pytest.raises(RuntimeError, match="Migration checksum mismatch"):
        KirigamiStore.from_cache_dir(tmp_path)


def test_migration_name_mismatch_fails_loudly(tmp_path: Path) -> None:
    store = KirigamiStore.from_cache_dir(tmp_path)
    with store.connect() as connection:
        connection.execute("update schema_migrations set name = 'other' where id = 0")

    with pytest.raises(RuntimeError, match="Migration name mismatch"):
        KirigamiStore.from_cache_dir(tmp_path)


def test_migration_loader_rejects_gaps(tmp_path: Path) -> None:
    (tmp_path / "0000_initial.py").write_text(
        "def migrate(store, connection):\n    pass\n",
        encoding="utf-8",
    )
    (tmp_path / "0002_later.py").write_text(
        "def migrate(store, connection):\n    pass\n",
        encoding="utf-8",
    )

    with pytest.raises(RuntimeError, match="Migration sequence has gaps"):
        load_migration_files(tmp_path)


def test_migration_loader_rejects_conflicting_numbers(tmp_path: Path) -> None:
    (tmp_path / "0000_initial.py").write_text(
        "def migrate(store, connection):\n    pass\n",
        encoding="utf-8",
    )
    (tmp_path / "0000_other.py").write_text(
        "def migrate(store, connection):\n    pass\n",
        encoding="utf-8",
    )

    with pytest.raises(RuntimeError, match="Conflicting migration number 0000"):
        load_migration_files(tmp_path)


def test_legacy_people_topic_and_pep_caches_are_imported(tmp_path: Path) -> None:
    _write_legacy_people_cache(tmp_path / "people.sqlite")
    (tmp_path / "topic_100.json").write_text(
        json.dumps(
            {
                "topic_id": 100,
                "title": "Imported topic",
                "slug": "imported-topic",
                "posts_count": 1,
                "last_posted_at": "2024-01-01T00:00:00Z",
                "posts": [
                    {
                        "id": 1001,
                        "post_number": 1,
                        "username": "alice",
                        "author_name": "Alice",
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2024-01-01T00:00:00Z",
                        "raw": "Hello",
                        "cooked": "<p>Hello</p>",
                        "reply_count": 0,
                        "quote_count": 0,
                        "reads": 1,
                        "score": 1.0,
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    pep_dir = tmp_path.parent / "peps"
    pep_dir.mkdir(exist_ok=True)
    (pep_dir / "pep-0999.json").write_text(
        json.dumps(
            {
                "fetched_epoch": 9_999_999_999,
                "status": "Final",
                "metadata": {
                    "number": 999,
                    "title": "Imported PEP",
                    "url": "https://peps.python.org/pep-0999/",
                    "status": "Final",
                    "type": None,
                    "topic": None,
                    "created": None,
                    "python_version": None,
                    "discussions_to": None,
                    "post_history": [],
                    "resolution": None,
                    "authors": [],
                    "sponsors": [],
                    "delegates": [],
                    "fetched_at": "2024-01-01T00:00:00Z",
                },
            }
        ),
        encoding="utf-8",
    )

    store = KirigamiStore.from_cache_dir(tmp_path)

    assert store.profile_row("alice") is not None
    assert store.topic_payload(100, "2024-01-01T00:00:00Z")["posts"][0]["raw"] == "Hello"
    assert store.pep_payload(999, ttl_seconds=10_000)["title"] == "Imported PEP"


def test_discourse_http_cache_normalizes_query_param_order(tmp_path: Path) -> None:
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(200, json={"calls": calls["n"]})

    store = KirigamiStore.from_cache_dir(tmp_path)
    client = httpx.Client(
        base_url="https://discuss.python.org",
        transport=httpx.MockTransport(handler),
    )

    first = store.get_discourse_json(client, "/search.json", params=[("b", 2), ("a", 1)])
    second = store.get_discourse_json(client, "/search.json", params={"a": 1, "b": 2})

    assert first == {"calls": 1}
    assert second == {"calls": 1}
    assert calls["n"] == 1


def test_discourse_http_cache_separates_auth_scopes(tmp_path: Path) -> None:
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(200, json={"calls": calls["n"]})

    store = KirigamiStore.from_cache_dir(tmp_path)
    transport = httpx.MockTransport(handler)
    public_client = httpx.Client(base_url="https://discuss.python.org", transport=transport)
    authed_client = httpx.Client(
        base_url="https://discuss.python.org",
        headers={"Api-Key": "secret", "Api-Username": "alice"},
        transport=transport,
    )

    assert store.get_discourse_json(public_client, "/latest.json") == {"calls": 1}
    assert store.get_discourse_json(authed_client, "/latest.json") == {"calls": 2}
    assert store.get_discourse_json(public_client, "/latest.json") == {"calls": 1}
    assert calls["n"] == 2


def test_discourse_http_cache_expires_after_five_minutes(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls = {"n": 0}
    clock = {"now": 1_000.0}
    monkeypatch.setattr(store_module.time, "time", lambda: clock["now"])

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        return httpx.Response(200, json={"calls": calls["n"]})

    store = KirigamiStore.from_cache_dir(tmp_path)
    client = httpx.Client(
        base_url="https://discuss.python.org",
        transport=httpx.MockTransport(handler),
    )

    assert store.get_discourse_json(client, "/latest.json") == {"calls": 1}
    assert store.get_discourse_json(client, "/latest.json") == {"calls": 1}
    clock["now"] += DISCOURSE_HTTP_CACHE_TTL_SECONDS + 1
    assert store.get_discourse_json(client, "/latest.json") == {"calls": 2}


def test_expired_cache_rows_are_physically_deleted(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    clock = {"now": 1_000.0}
    monkeypatch.setattr(store_module.time, "time", lambda: clock["now"])

    store = KirigamiStore.from_cache_dir(tmp_path)
    store.set_api_cache("topics:recent", {"ok": True})
    store.store_discourse_json(
        base_url="https://discuss.python.org",
        path="/latest.json",
        query_json="[]",
        auth_scope="public",
        status_code=200,
        payload={"ok": True},
    )

    with store.connect() as connection:
        assert connection.execute("select count(*) from api_cache_entries").fetchone()[0] == 1
        assert connection.execute("select count(*) from discourse_http_cache").fetchone()[0] == 1

    clock["now"] += DISCOURSE_HTTP_CACHE_TTL_SECONDS + 1
    assert store.get_api_cache("topics:recent") is None

    with store.connect() as connection:
        assert connection.execute("select count(*) from api_cache_entries").fetchone()[0] == 0
        assert connection.execute("select count(*) from discourse_http_cache").fetchone()[0] == 0


def test_clear_all_cache_preserves_durable_tables(tmp_path: Path) -> None:
    store = KirigamiStore.from_cache_dir(tmp_path)
    store.set_api_cache("topics:recent", {"ok": True})
    store.store_discourse_json(
        base_url="https://discuss.python.org",
        path="/latest.json",
        query_json="[]",
        auth_scope="public",
        status_code=200,
        payload={"ok": True},
    )

    store.clear_all_cache()

    with store.connect() as connection:
        assert connection.execute("select count(*) from api_cache_entries").fetchone()[0] == 0
        assert connection.execute("select count(*) from discourse_http_cache").fetchone()[0] == 0
        assert connection.execute("select count(*) from schema_migrations").fetchone()[0] == 4


def test_transient_discourse_failures_are_not_cached(tmp_path: Path) -> None:
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["n"] += 1
        if calls["n"] == 1:
            return httpx.Response(503, text="unavailable")
        return httpx.Response(200, json={"calls": calls["n"]})

    store = KirigamiStore.from_cache_dir(tmp_path)
    client = httpx.Client(
        base_url="https://discuss.python.org",
        transport=httpx.MockTransport(handler),
    )

    assert store.get_discourse_json(client, "/latest.json") == {"calls": 2}
    assert store.get_discourse_json(client, "/latest.json") == {"calls": 2}
    assert calls["n"] == 2


def _write_legacy_people_cache(path: Path) -> None:
    with sqlite3.connect(path) as connection:
        connection.execute(
            """
            create table profiles (
                username_key text primary key,
                username text not null,
                name text,
                user_id integer,
                avatar_template text,
                primary_group_name text,
                trust_level integer,
                admin integer not null default 0,
                moderator integer not null default 0,
                seen_in_topic_ids text not null default '[]',
                raw_json text not null default '{}',
                fetched_epoch real not null
            )
            """
        )
        connection.execute(
            """
            insert into profiles (
                username_key, username, name, user_id, avatar_template,
                primary_group_name, trust_level, admin, moderator,
                seen_in_topic_ids, raw_json, fetched_epoch
            )
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "alice",
                "alice",
                "Alice",
                1,
                None,
                None,
                2,
                0,
                0,
                "[100]",
                "{}",
                1_000,
            ),
        )
