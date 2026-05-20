from __future__ import annotations

from kirigami.discourse.people import (
    DiscourseUserProfile,
    PeopleCache,
    match_pep_people_to_discourse_users,
    roles_for_username,
)
from kirigami.pep import PepMetadata, PepPerson


def test_people_cache_round_trips_profiles(tmp_path) -> None:
    cache = PeopleCache(tmp_path / "people.sqlite")

    cache.upsert_profile(
        DiscourseUserProfile(username="pf_moore", name="Paul Moore", trust_level=3),
        topic_id=123,
    )

    profile = cache.get_profile("PF_MOORE")
    assert profile is not None
    assert profile.username == "pf_moore"
    assert profile.name == "Paul Moore"


def test_role_matching_uses_display_name_when_username_differs() -> None:
    metadata = PepMetadata(
        number=751,
        title="Lock files",
        url="https://peps.python.org/pep-0751/",
        status="Final",
        type=None,
        topic=None,
        created=None,
        python_version=None,
        discussions_to=None,
        post_history=[],
        resolution=None,
        authors=[PepPerson("Paul Moore")],
        sponsors=[],
        delegates=[],
        fetched_at="2026-01-01T00:00:00Z",
    )

    matches = match_pep_people_to_discourse_users(
        metadata,
        [DiscourseUserProfile(username="pf_moore", name="Paul Moore")],
    )

    assert matches[0].username == "pf_moore"
    assert matches[0].confirmed is True
    assert roles_for_username(matches, "pf_moore")[0]["role"] == "author"


def test_role_matching_marks_unmatched_people_unconfirmed() -> None:
    metadata = PepMetadata(
        number=751,
        title="Lock files",
        url="https://peps.python.org/pep-0751/",
        status="Final",
        type=None,
        topic=None,
        created=None,
        python_version=None,
        discussions_to=None,
        post_history=[],
        resolution=None,
        authors=[PepPerson("Sam Gross")],
        sponsors=[],
        delegates=[],
        fetched_at="2026-01-01T00:00:00Z",
    )

    matches = match_pep_people_to_discourse_users(
        metadata,
        [DiscourseUserProfile(username="colesbury", name="Sam Gross")],
        aliases={"Sam Gross": "colesbury"},
    )

    assert matches[0].username == "colesbury"
    assert matches[0].method == "alias"
    assert matches[0].confirmed is True
