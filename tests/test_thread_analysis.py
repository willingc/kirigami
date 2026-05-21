from __future__ import annotations

from kirigami.thread_analysis import analyze_thread_document


def test_late_convergence_cools_early_disagreement() -> None:
    document = {
        "posts": [
            _post(1, "alice", "I disagree with the pylock.toml direction. This is a risk."),
            _post(2, "bob", "I have the same concern about pylock.toml."),
            _post(3, "carol", "Could we clarify the pylock.toml behavior?"),
            _post(4, "alice", "Fair point, I agree the revised pylock.toml text works."),
            _post(5, "bob", "The pylock.toml proposal was revised and resolved."),
        ]
    }

    topic = _topic_containing(analyze_thread_document(document), "pylock.toml")

    assert topic["disagreement_score"] < 4
    assert topic["burn"]["label"] in {"cool", "warm"}
    assert isinstance(topic["description"], str)
    assert topic["description"]


def test_tiny_tangent_is_capped_in_large_thread() -> None:
    posts = [_post(number, "reader", "General packaging update.") for number in range(1, 59)]
    posts.extend(
        [
            _post(59, "alice", "I strongly disagree with pylock.toml. This is a blocker."),
            _post(60, "bob", "I object to pylock.toml and worry about the risk."),
        ]
    )

    topic = _topic_containing(analyze_thread_document({"posts": posts}), "pylock.toml")

    assert topic["thread_share"] < 0.05
    assert topic["disagreement_score"] <= 4
    assert topic["burn"]["label"] != "burning"


def test_recent_unresolved_multi_participant_disagreement_burns() -> None:
    posts = [
        _post(1, "alice", "The pylock.toml proposal starts here."),
        _post(2, "bob", "I support the pylock.toml direction."),
        _post(3, "carol", "The pylock.toml update is reasonable."),
        _post(4, "dave", "I have a question about pylock.toml."),
        _post(5, "erin", "Could we clarify pylock.toml?"),
        _post(6, "frank", "I disagree with pylock.toml and see a compatibility risk.", replies=2),
        _post(7, "grace", "I object to pylock.toml; this is a blocker.", quotes=2),
        _post(8, "heidi", "I am not convinced pylock.toml handles existing users.", replies=1),
        _post(9, "ivan", "My concern with pylock.toml is still unresolved.", quotes=1),
        _post(10, "judy", "What about the pylock.toml migration risk?"),
    ]

    topic = _topic_containing(analyze_thread_document({"posts": posts}), "pylock.toml")

    assert topic["disagreement_score"] >= 7
    assert topic["burn"]["label"] == "burning"
    assert "risk" in topic["label"].casefold()


def test_participant_stance_uses_latest_relevant_post() -> None:
    document = {
        "posts": [
            _post(1, "alice", "I disagree with pylock.toml because of migration risk."),
            _post(2, "bob", "I support pylock.toml."),
            _post(3, "alice", "Fair point, I now agree with the revised pylock.toml proposal."),
        ]
    }

    topic = _topic_containing(analyze_thread_document(document), "pylock.toml")
    alice = next(stance for stance in topic["participant_stances"] if stance["username"] == "alice")

    assert alice["latest_post_number"] == 3
    assert alice["stance"] in {"approving", "strongly_approving"}


def test_priority_order_favors_recent_recurring_debate() -> None:
    posts = [
        _post(1, "alice", "I disagree with pylock.toml."),
        _post(2, "bob", "I have a concern with pylock.toml."),
        _post(3, "carol", "General packaging note."),
        _post(4, "dave", "The variant label question needs clarification."),
        _post(5, "erin", "I disagree with the variant label behavior.", replies=1),
        _post(6, "frank", "The variant label risk is still open.", quotes=1),
        _post(7, "grace", "Could we clarify the variant label migration?"),
    ]

    analysis = analyze_thread_document({"posts": posts})

    assert analysis["topics"][0]["label"] == "Variant Label Migration"
    assert analysis["topics"][0]["description"]


def test_empty_set_discussion_uses_source_derived_label() -> None:
    analysis = analyze_thread_document(
        {
            "posts": [
                _post(1, "alice", "PEP 802 proposes display syntax for the empty set."),
                _post(2, "bob", "I disagree that {/} is better than set()."),
                _post(3, "carol", "Could we clarify the empty set teaching cost?"),
            ]
        }
    )
    labels = [topic["label"] for topic in analysis["topics"]]

    assert any("empty set" in label.casefold() for label in labels)
    assert any(len(label.split()) >= 3 for label in labels if "empty set" in label.casefold())
    assert all("null" not in label.casefold() for label in labels)


def test_intersection_types_use_source_derived_label() -> None:
    analysis = analyze_thread_document(
        {
            "posts": [
                _post(1, "alice", "A reduced form of intersection types might get into the spec faster."),
                _post(2, "bob", "I disagree that this feature is small enough."),
                _post(3, "carol", "Could protocols cover most intersection type use cases?"),
            ]
        }
    )
    labels = [topic["label"] for topic in analysis["topics"]]

    assert any("intersection type" in label.casefold() or "intersection types" in label.casefold() for label in labels)
    assert any(len(label.split()) >= 3 for label in labels if "intersection" in label.casefold())
    assert all("properties" not in label.casefold() for label in labels)


def test_topic_labels_do_not_include_code_list_html_artifacts() -> None:
    analysis = analyze_thread_document(
        {
            "posts": [
                _post(
                    1,
                    "alice",
                    "I object to the pylock.toml migration risk.",
                    cooked=(
                        "<p>I object to the pylock.toml migration risk.</p>"
                        '<pre><ol class="linenums" start="1" style="counter-reset: item 0">'
                        "<li>results = {}</li><li>return results</li></ol></pre>"
                    ),
                ),
                _post(2, "bob", "Could we clarify the pylock.toml migration risk?"),
                _post(3, "carol", "The pylock.toml migration risk remains unresolved."),
            ]
        }
    )

    labels = [str(topic["label"]).casefold() for topic in analysis["topics"]]

    assert any("pylock.toml" in label for label in labels)
    assert all("<ol" not in label for label in labels)
    assert all("<li" not in label for label in labels)
    assert all("counter-reset" not in label for label in labels)
    assert all("results" not in label for label in labels)


def _topic(analysis: dict[str, object], label: str) -> dict[str, object]:
    topics = analysis["topics"]
    assert isinstance(topics, list)
    for topic in topics:
        assert isinstance(topic, dict)
        if topic["label"] == label:
            return topic
    raise AssertionError(f"topic {label!r} not found")


def _topic_containing(analysis: dict[str, object], label_fragment: str) -> dict[str, object]:
    topics = analysis["topics"]
    assert isinstance(topics, list)
    for topic in topics:
        assert isinstance(topic, dict)
        if label_fragment.casefold() in str(topic["label"]).casefold():
            return topic
    raise AssertionError(f"topic containing {label_fragment!r} not found")


def _post(
    number: int,
    username: str,
    text: str,
    *,
    cooked: str | None = None,
    replies: int = 0,
    quotes: int = 0,
) -> dict[str, object]:
    return {
        "id": number,
        "post_number": number,
        "username": username,
        "created_at": f"2024-01-{number:02d}T00:00:00Z",
        "updated_at": f"2024-01-{number:02d}T00:00:00Z",
        "raw": text,
        "cooked": cooked or f"<p>{text}</p>",
        "reply_count": replies,
        "quote_count": quotes,
        "reads": 0,
        "score": 0,
        "author_roles": [],
    }
