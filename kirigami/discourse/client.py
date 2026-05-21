"""Shared Discourse client configuration."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

import httpx

from .resolve import DISCOURSE_BASE_URL


@dataclass(frozen=True, slots=True)
class DiscourseSettings:
    """Runtime settings for Discourse API access."""

    base_url: str
    api_key: str | None
    api_username: str | None
    user_api_key: str | None
    cache_dir: Path


def load_discourse_settings(*, load_env: bool = True) -> DiscourseSettings:
    """Load Discourse settings from environment and optional dotenv file."""
    if load_env:
        load_dotenv_file()

    return DiscourseSettings(
        base_url=os.environ.get("DISCOURSE_BASE_URL", DISCOURSE_BASE_URL).rstrip("/"),
        api_key=_clean_secret(os.environ.get("DISCOURSE_API_KEY")),
        api_username=_clean_secret(os.environ.get("DISCOURSE_USERNAME")),
        user_api_key=_clean_secret(os.environ.get("DISCOURSE_USER_API_KEY")),
        cache_dir=Path(os.environ.get("KIRIGAMI_DISCOURSE_CACHE_DIR", ".cache/kirigami/discourse")),
    )


def load_dotenv_file() -> None:
    """Load project dotenv values when python-dotenv is installed."""
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv()


def discourse_headers(settings: DiscourseSettings) -> dict[str, str]:
    """Return API auth headers for Discourse's HTTP API."""
    if settings.user_api_key:
        return {"User-Api-Key": settings.user_api_key}
    if not settings.api_key or not settings.api_username:
        return {}
    return {
        "Api-Key": settings.api_key,
        "Api-Username": settings.api_username,
    }


def _clean_secret(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    placeholders = {
        "your_api_key_here",
        "your_discourse_username",
        "your_discourse_user_api_key_here",
        "changeme",
        "change_me",
    }
    if cleaned.lower() in placeholders:
        return None
    return cleaned


def create_httpx_discourse_client(
    settings: DiscourseSettings | None = None,
    *,
    timeout: float = 30.0,
) -> httpx.Client:
    """Create an authenticated HTTPX client for Discourse."""
    loaded = settings or load_discourse_settings()
    return httpx.Client(
        base_url=loaded.base_url,
        headers=discourse_headers(loaded),
        timeout=timeout,
    )


def create_pydiscourse_client(settings: DiscourseSettings | None = None):
    """Create a pydiscourse client from the same runtime settings."""
    from pydiscourse import DiscourseClient

    loaded = settings or load_discourse_settings()
    return DiscourseClient(
        loaded.base_url,
        api_username=loaded.api_username,
        api_key=loaded.api_key,
    )
