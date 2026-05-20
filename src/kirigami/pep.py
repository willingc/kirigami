"""Fetch and parse metadata from peps.python.org."""

from __future__ import annotations

import html
import json
import re
import time
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

import httpx

PEP_BASE_URL = "https://peps.python.org"
ACTIVE_STATUSES = {"Draft", "Deferred", "Provisional"}
ACTIVE_CACHE_TTL_SECONDS = 24 * 60 * 60
FINAL_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60


@dataclass(frozen=True, slots=True)
class PepPerson:
    """A person listed in a PEP header."""

    name: str
    email: str | None = None


@dataclass(frozen=True, slots=True)
class PepMetadata:
    """Metadata extracted from a PEP page."""

    number: int
    title: str
    url: str
    status: str | None
    type: str | None
    topic: str | None
    created: str | None
    python_version: str | None
    discussions_to: str | None
    post_history: list[str]
    resolution: str | None
    authors: list[PepPerson]
    sponsors: list[PepPerson]
    delegates: list[PepPerson]
    fetched_at: str

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-serializable representation."""
        return asdict(self)


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style"}:
            self._skip_depth += 1
            return
        if tag in {"p", "div", "section", "article", "header", "footer", "li", "dt", "dd"}:
            self.parts.append("\n")
        if tag in {"h1", "h2", "h3", "tr", "br"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"} and self._skip_depth:
            self._skip_depth -= 1
            return
        if tag in {"p", "div", "section", "article", "li", "dt", "dd", "h1", "h2", "h3", "tr"}:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        text = data.strip()
        if text:
            self.parts.append(text)

    def text(self) -> str:
        return "\n".join(self.parts)


def fetch_pep_metadata(
    pep: int,
    *,
    client: httpx.Client | None = None,
    cache_dir: Path | str | None = None,
) -> PepMetadata:
    """Fetch and parse a PEP metadata header."""
    if pep < 1:
        raise ValueError(f"PEP number must be a positive integer, got {pep!r}")

    cache_root = Path(cache_dir) if cache_dir is not None else None
    if cache_root is not None:
        cached = _read_cache(cache_root, pep)
        if cached is not None:
            return cached

    url = pep_url(pep)
    owns_client = client is None
    if owns_client:
        client = httpx.Client(timeout=30.0)

    try:
        response = client.get(url)
        response.raise_for_status()
        metadata = parse_pep_metadata(response.text, source_url=url, pep=pep)
    finally:
        if owns_client:
            client.close()

    if cache_root is not None:
        _write_cache(cache_root, metadata)

    return metadata


def parse_pep_metadata(html_text: str, *, source_url: str, pep: int | None = None) -> PepMetadata:
    """Extract the role-bearing header fields from a PEP HTML page."""
    extractor = _TextExtractor()
    extractor.feed(html_text)
    lines = _normalized_lines(extractor.text())
    number = pep or _parse_pep_number(lines, source_url)
    title = _parse_title(lines, number)
    fields = _parse_header_fields(lines)

    fetched_at = _utc_now()
    return PepMetadata(
        number=number,
        title=title,
        url=source_url,
        status=_first(fields, "Status"),
        type=_first(fields, "Type"),
        topic=_first(fields, "Topic"),
        created=_first(fields, "Created"),
        python_version=_first(fields, "Python-Version"),
        discussions_to=_first(fields, "Discussions-To"),
        post_history=fields.get("Post-History", []),
        resolution=_first(fields, "Resolution"),
        authors=_people(fields.get("Author", []) + fields.get("Authors", [])),
        sponsors=_people(fields.get("Sponsor", []) + fields.get("Sponsors", [])),
        delegates=_people(
            fields.get("PEP-Delegate", [])
            + fields.get("PEP-Delegates", [])
            + fields.get("BDFL-Delegate", [])
            + fields.get("BDFL-Delegates", [])
        ),
        fetched_at=fetched_at,
    )


def pep_url(pep: int) -> str:
    """Return the canonical PEP URL."""
    return f"{PEP_BASE_URL}/pep-{pep:04d}/"


def _normalized_lines(text: str) -> list[str]:
    lines: list[str] = []
    for line in text.splitlines():
        normalized = re.sub(r"\s+", " ", html.unescape(line)).strip()
        normalized = re.sub(r"^:\s*", "", normalized).strip()
        if normalized and normalized != ":":
            lines.append(normalized)
    return lines


def _parse_pep_number(lines: list[str], source_url: str) -> int:
    for value in [source_url, *lines[:20]]:
        match = re.search(r"\bpep[-\s]?0*(\d{1,4})\b", value, re.IGNORECASE)
        if match:
            return int(match.group(1))
    raise ValueError("could not determine PEP number")


def _parse_title(lines: list[str], pep: int) -> str:
    pattern = re.compile(rf"\bPEP\s+0*{pep}\b\s*[–-]\s*(.+)", re.IGNORECASE)
    for line in lines[:30]:
        match = pattern.search(line)
        if match:
            return match.group(1).strip()
    return f"PEP {pep}"


def _parse_header_fields(lines: list[str]) -> dict[str, list[str]]:
    known_fields = {
        "Author",
        "Authors",
        "Status",
        "Type",
        "Topic",
        "Created",
        "Python-Version",
        "Discussions-To",
        "Post-History",
        "Resolution",
        "Sponsor",
        "Sponsors",
        "PEP-Delegate",
        "PEP-Delegates",
        "BDFL-Delegate",
        "BDFL-Delegates",
    }
    fields: dict[str, list[str]] = {}
    current: str | None = None
    started = False

    for line in lines:
        if line == "Table of Contents" or line.startswith("Abstract"):
            break
        label = line[:-1] if line.endswith(":") else line
        if label in known_fields:
            started = True
            current = label
            fields.setdefault(current, [])
            continue
        inline_match = re.match(r"^([A-Za-z-]+):\s+(.+)$", line)
        if inline_match and inline_match.group(1) in known_fields:
            started = True
            current = inline_match.group(1)
            fields.setdefault(current, []).append(inline_match.group(2))
            continue
        if started and current:
            fields[current].append(line)

    return fields


def _first(fields: dict[str, list[str]], key: str) -> str | None:
    values = [value for value in fields.get(key, []) if value]
    return " ".join(values).strip() if values else None


def _people(values: list[str]) -> list[PepPerson]:
    joined = " ".join(values)
    if not joined:
        return []
    joined = joined.replace(" and ", ", ")
    raw_people = [part.strip() for part in re.split(r",|;", joined) if part.strip()]
    people: list[PepPerson] = []
    seen: set[tuple[str, str | None]] = set()
    for raw_person in raw_people:
        email_match = re.search(r"<([^>]+)>", raw_person)
        email = email_match.group(1).strip() if email_match else None
        name = re.sub(r"<[^>]+>", "", raw_person)
        name = re.sub(r"\([^)]*\)", "", name)
        name = re.sub(r"^:\s*", "", name)
        name = re.sub(r"\s+", " ", name).strip()
        if not name:
            continue
        person = PepPerson(name=name, email=email)
        key = (person.name.casefold(), person.email.casefold() if person.email else None)
        if key not in seen:
            people.append(person)
            seen.add(key)
    return people


def _read_cache(cache_root: Path, pep: int) -> PepMetadata | None:
    path = _cache_path(cache_root, pep)
    if not path.is_file():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    status = payload.get("status")
    ttl = ACTIVE_CACHE_TTL_SECONDS if status in ACTIVE_STATUSES else FINAL_CACHE_TTL_SECONDS
    fetched_epoch = float(payload.get("fetched_epoch", 0))
    if time.time() - fetched_epoch > ttl:
        return None
    return _metadata_from_payload(payload["metadata"])


def _write_cache(cache_root: Path, metadata: PepMetadata) -> None:
    cache_root.mkdir(parents=True, exist_ok=True)
    path = _cache_path(cache_root, metadata.number)
    path.write_text(
        json.dumps(
            {
                "fetched_epoch": time.time(),
                "status": metadata.status,
                "metadata": metadata.to_dict(),
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def _metadata_from_payload(payload: dict[str, Any]) -> PepMetadata:
    return PepMetadata(
        number=int(payload["number"]),
        title=_clean_header_value(payload.get("title")),
        url=str(payload.get("url") or ""),
        status=_clean_optional_header_value(payload.get("status")),
        type=_clean_optional_header_value(payload.get("type")),
        topic=_clean_optional_header_value(payload.get("topic")),
        created=_clean_optional_header_value(payload.get("created")),
        python_version=_clean_optional_header_value(payload.get("python_version")),
        discussions_to=_clean_optional_header_value(payload.get("discussions_to")),
        post_history=[
            _clean_header_value(value) for value in payload.get("post_history", [])
        ],
        resolution=_clean_optional_header_value(payload.get("resolution")),
        authors=[_person_from_payload(person) for person in payload.get("authors", [])],
        sponsors=[_person_from_payload(person) for person in payload.get("sponsors", [])],
        delegates=[_person_from_payload(person) for person in payload.get("delegates", [])],
        fetched_at=str(payload.get("fetched_at") or ""),
    )


def _person_from_payload(payload: dict[str, Any]) -> PepPerson:
    return PepPerson(
        name=_clean_header_value(payload.get("name")),
        email=_clean_optional_header_value(payload.get("email")),
    )


def _clean_optional_header_value(value: Any) -> str | None:
    cleaned = _clean_header_value(value)
    return cleaned or None


def _clean_header_value(value: Any) -> str:
    return re.sub(r"^:\s*", "", str(value or "")).strip()


def _cache_path(cache_root: Path, pep: int) -> Path:
    return cache_root / f"pep-{pep:04d}.json"


def _utc_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
