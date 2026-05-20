"""Import legacy Discourse people cache rows."""

from __future__ import annotations

import sqlite3
from typing import Any


def migrate(store: Any, connection: sqlite3.Connection) -> None:
    from kirigami.store import _import_people_cache

    _import_people_cache(store, connection)
