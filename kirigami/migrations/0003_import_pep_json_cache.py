"""Import legacy PEP metadata JSON cache files."""

from __future__ import annotations

import sqlite3
from typing import Any


def migrate(store: Any, connection: sqlite3.Connection) -> None:
    from kirigami.store import _import_pep_json_cache

    _import_pep_json_cache(store, connection)
