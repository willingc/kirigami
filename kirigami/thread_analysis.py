"""Deterministic thread-level topic and disagreement analysis."""

from __future__ import annotations

import html
import math
import re
from collections import Counter, defaultdict
from typing import Any

ANALYSIS_VERSION = 6
WORDS_PER_EXCERPT = 42
WORDS_PER_MINUTE = 220
MAX_TOPIC_LABEL_WORDS = 6
SIGNAL_CATEGORIES = (
    "agreement",
    "disagreement",
    "question",
    "progress",
    "concession",
    "revision",
    "resolution",
)

KEYWORDS: dict[str, tuple[str, ...]] = {
    "agreement": (
        "agree",
        "agreed",
        "agreement",
        "consensus",
        "support",
        "sounds good",
        "makes sense",
        "reasonable",
        "yes",
        "+1",
        "no objection",
    ),
    "disagreement": (
        "disagree",
        "concern",
        "concerns",
        "objection",
        "object",
        "against",
        "not convinced",
        "problem",
        "issue",
        "risk",
        "worry",
        "blocker",
        "however",
        "but",
    ),
    "question": (
        "?",
        "question",
        "clarify",
        "what about",
        "how would",
        "why",
        "can you",
        "could we",
        "does that",
    ),
    "progress": (
        "proposal",
        "propose",
        "suggest",
        "next step",
        "update",
        "revised",
        "decided",
        "resolved",
        "compromise",
        "change",
        "remove",
        "drop",
        "accept",
        "conclusion",
    ),
    "concession": (
        "changed my mind",
        "i'm convinced",
        "i am convinced",
        "fair point",
        "i was wrong",
        "i now think",
        "i concede",
        "you're right",
        "you are right",
    ),
    "revision": (
        "updated the pep",
        "revised the pep",
        "revised the proposal",
        "adjusted the proposal",
        "change the pep",
        "drop this",
        "remove this",
        "narrow the scope",
    ),
    "resolution": (
        "accepted",
        "rejected",
        "resolved by",
        "resolution",
        "final decision",
        "pep is final",
        "no longer open",
    ),
}

GENERIC_TECH_TERMS = {
    "PEP",
    "API",
    "UTC",
    "HTML",
    "JSON",
    "TOML",
    "Python",
    "Discourse",
}
GENERIC_TECH_TERM_KEYS = {term.casefold() for term in GENERIC_TECH_TERMS}

TOPIC_STOPWORDS = {
    "about",
    "above",
    "after",
    "again",
    "against",
    "and",
    "are",
    "around",
    "but",
    "can",
    "also",
    "for",
    "another",
    "has",
    "not",
    "now",
    "off",
    "our",
    "out",
    "own",
    "per",
    "the",
    "then",
    "too",
    "use",
    "was",
    "way",
    "you",
    "your",
    "all",
    "any",
    "its",
    "may",
    "one",
    "two",
    "who",
    "why",
    "will",
    "via",
    "yet",
    "were",
    "than",
    "such",
    "both",
    "each",
    "they",
    "them",
    "make",
    "made",
    "form",
    "reduced",
    "general",
    "proposal",
    "proposes",
    "fwiw",
    "imho",
    "imo",
    "direction",
    "behavior",
    "update",
    "text",
    "cost",
    "because",
    "been",
    "being",
    "better",
    "could",
    "does",
    "doing",
    "down",
    "even",
    "from",
    "have",
    "here",
    "into",
    "just",
    "like",
    "many",
    "maybe",
    "more",
    "most",
    "much",
    "need",
    "needs",
    "only",
    "other",
    "over",
    "people",
    "really",
    "same",
    "should",
    "some",
    "still",
    "that",
    "their",
    "there",
    "these",
    "thing",
    "think",
    "this",
    "those",
    "thread",
    "through",
    "using",
    "very",
    "what",
    "when",
    "where",
    "which",
    "while",
    "with",
    "would",
}

SIGNAL_WORDS = {
    "agree",
    "agreed",
    "agreement",
    "blocker",
    "clarify",
    "concern",
    "concerns",
    "disagree",
    "issue",
    "object",
    "objection",
    "problem",
    "question",
    "risk",
    "support",
    "worry",
}

LABEL_FILLER_WORDS = {
    "agree",
    "agreed",
    "against",
    "blocker",
    "clarify",
    "concern",
    "concerns",
    "convinced",
    "cover",
    "covers",
    "disagree",
    "make",
    "makes",
    "get",
    "faster",
    "need",
    "needs",
    "not",
    "object",
    "objection",
    "proposal",
    "propose",
    "proposed",
    "reasonable",
    "see",
    "small",
    "enough",
    "start",
    "starts",
    "support",
    "supports",
    "thing",
    "unresolved",
    "update",
    "updated",
    "work",
    "works",
}


def analyze_thread_document(document: dict[str, Any]) -> dict[str, Any]:
    """Return a source-linked topic, priority, and disagreement analysis."""
    posts = [
        _normalize_post(post, index=index)
        for index, post in enumerate(document.get("posts") or [])
        if isinstance(post, dict)
    ]
    quote_counts = _quoted_post_counts(posts)
    signals_by_post = _signals_by_post(posts)
    topic = document.get("topic") or {}
    title_mentions = _topic_mentions_for_text(str(topic.get("title") or ""))
    buckets = _topic_buckets(posts, signals_by_post, quote_counts, title_mentions)
    topics = [
        _topic_payload(bucket, posts, signals_by_post)
        for bucket in buckets.values()
        if bucket["post_numbers"]
    ]
    topics.sort(
        key=lambda topic: (
            -float(topic["priority_score"]),
            -int(topic["last_post_number"]),
            str(topic["label"]).casefold(),
        )
    )
    topics = topics[:12]

    burning_topics = [topic for topic in topics if topic["burn"]["label"] == "burning"]
    recently_active = [topic for topic in topics if float(topic["recency_score"]) >= 0.62]
    overview = {
        "topic_count": len(topics),
        "burning_count": len(burning_topics),
        "latest_topic_label": topics[0]["label"] if topics else "",
        "highest_burn_score": max((float(topic["disagreement_score"]) for topic in topics), default=0.0),
        "recently_active_count": len(recently_active),
        "summary": _overview_summary(topics),
    }
    return {
        "version": ANALYSIS_VERSION,
        "generated_by": f"kirigami.thread_analysis.v{ANALYSIS_VERSION}",
        "overview": overview,
        "topics": topics,
    }


def analyze_conversation_document(document: dict[str, Any]) -> dict[str, Any]:
    """Return the source-linked evidence-map analysis rendered by the frontend."""
    posts = [
        _normalize_post(post, index=index)
        for index, post in enumerate(document.get("posts") or [])
        if isinstance(post, dict)
    ]
    quote_counts = _quoted_post_counts(posts)
    signals_by_post = _signals_by_post(posts)
    signals = _signals_record(signals_by_post)
    topic_analysis = analyze_thread_document(document)
    issues = _discussion_issues(topic_analysis, posts, signals_by_post)

    return {
        "metrics": {
            "posts": len(posts),
            "participants": len({post["username"] for post in posts}),
            "replies": sum(post["reply_count"] for post in posts),
            "reads": sum(_int(post.get("reads")) for post in posts),
            "quotes": sum(post["quote_count"] for post in posts),
            "estimatedReadMinutes": max(
                1,
                round(sum(len(post["text"].split()) for post in posts) / WORDS_PER_MINUTE),
            ),
            "firstPostAt": posts[0]["created_at"] if posts else "",
            "lastPostAt": posts[-1]["created_at"] if posts else "",
        },
        "authors": _author_summaries(posts, signals_by_post, quote_counts),
        "phases": _phases(posts, signals_by_post),
        "signals": signals,
        "topQuoteTargets": _top_quote_targets(posts, quote_counts),
        "issues": issues,
        "positionEvents": _position_events(posts, signals_by_post),
    }


def _normalize_post(post: dict[str, Any], *, index: int) -> dict[str, Any]:
    text = _post_text(post)
    return {
        "index": index,
        "id": int(post.get("id") or 0),
        "post_number": int(post.get("post_number") or index + 1),
        "username": str(post.get("username") or "unknown"),
        "created_at": str(post.get("created_at") or ""),
        "text": text,
        "lower_text": text.lower(),
        "cooked": str(post.get("cooked") or ""),
        "reply_count": _int(post.get("reply_count")),
        "quote_count": _int(post.get("quote_count")),
        "reads": _int(post.get("reads")),
        "roles": list(post.get("author_roles") or []),
    }


def _signals_by_post(posts: list[dict[str, Any]]) -> dict[int, list[dict[str, Any]]]:
    signals: dict[int, list[dict[str, Any]]] = {}
    for post in posts:
        post_signals: list[dict[str, Any]] = []
        for category in SIGNAL_CATEGORIES:
            terms = [term for term in KEYWORDS[category] if term in post["lower_text"]]
            if not terms:
                continue
            post_signals.append(
                {
                    "category": category,
                    "post_number": post["post_number"],
                    "username": post["username"],
                    "created_at": post["created_at"],
                    "score": len(terms) + post["quote_count"] * 0.25 + post["reply_count"] * 0.2,
                    "evidence": _excerpt_around(post["text"], terms[0]),
                    "matched_terms": terms[:5],
                }
            )
        signals[post["post_number"]] = post_signals
    return signals


def _topic_buckets(
    posts: list[dict[str, Any]],
    signals_by_post: dict[int, list[dict[str, Any]]],
    quote_counts: dict[int, int],
    title_mentions: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    buckets: dict[str, dict[str, Any]] = defaultdict(_empty_bucket)
    for post in posts:
        mentions = _topic_mentions_for_post(post)
        if post["index"] == 0:
            mentions = [*title_mentions, *mentions]
        if not mentions:
            continue
        seen_keys = set()
        for mention in mentions:
            key = str(mention["key"])
            if key in seen_keys:
                continue
            seen_keys.add(key)
            bucket = buckets[key]
            bucket["post_numbers"].add(post["post_number"])
            bucket["participants"].add(post["username"])
            bucket["reply_count"] += post["reply_count"]
            bucket["quote_count"] += post["quote_count"] + quote_counts.get(post["post_number"], 0)
            bucket["latest_index"] = max(bucket["latest_index"], post["index"])
            bucket["first_index"] = min(bucket["first_index"], post["index"])
            bucket["posts"].append(post)
            bucket["signals"].extend(signals_by_post.get(post["post_number"], []))
            label = str(mention["label"])
            recency_boost = 0.35 + 2.65 * _position_ratio(post["index"], max(1, len(posts)))
            bucket["label_scores"][label] += float(mention["score"]) * recency_boost
    return buckets


def _empty_bucket() -> dict[str, Any]:
    return {
        "post_numbers": set(),
        "participants": set(),
        "reply_count": 0,
        "quote_count": 0,
        "latest_index": -1,
        "first_index": math.inf,
        "posts": [],
        "signals": [],
        "label_scores": Counter(),
    }


def _topic_mentions_for_post(post: dict[str, Any]) -> list[dict[str, Any]]:
    return _topic_mentions_for_text(post["text"])


def _signals_record(signals_by_post: dict[int, list[dict[str, Any]]]) -> dict[str, list[dict[str, Any]]]:
    signals = {category: [] for category in SIGNAL_CATEGORIES}
    for post_signals in signals_by_post.values():
        for signal in post_signals:
            signals[signal["category"]].append(_signal_payload(signal))
    for category in SIGNAL_CATEGORIES:
        signals[category].sort(key=lambda signal: (-float(signal["score"]), int(signal["postNumber"])))
    return signals


def _signal_payload(signal: dict[str, Any]) -> dict[str, Any]:
    return {
        "category": signal["category"],
        "postNumber": signal["post_number"],
        "username": signal["username"],
        "createdAt": signal["created_at"],
        "score": signal["score"],
        "evidence": signal["evidence"],
        "matchedTerms": signal["matched_terms"],
    }


def _author_summaries(
    posts: list[dict[str, Any]],
    signals_by_post: dict[int, list[dict[str, Any]]],
    quote_counts: dict[int, int],
) -> list[dict[str, Any]]:
    by_author: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for post in posts:
        by_author[post["username"]].append(post)

    authors = []
    for username, author_posts in by_author.items():
        post_numbers = {post["post_number"] for post in author_posts}
        authors.append(
            {
                "username": username,
                "posts": len(author_posts),
                "firstPostAt": author_posts[0]["created_at"] if author_posts else "",
                "lastPostAt": author_posts[-1]["created_at"] if author_posts else "",
                "reads": sum(post["reads"] for post in author_posts),
                "replies": sum(post["reply_count"] for post in author_posts),
                "quotesReceived": sum(quote_counts.get(post_number, 0) for post_number in post_numbers),
                "signalCounts": _count_signals(signals_by_post, post_numbers),
                "roles": _merged_roles(author_posts),
                "postNumbers": [post["post_number"] for post in author_posts],
            }
        )
    authors.sort(key=lambda author: (-int(author["posts"]), str(author["username"]).casefold()))
    return authors


def _discussion_issues(
    topic_analysis: dict[str, Any],
    posts: list[dict[str, Any]],
    signals_by_post: dict[int, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    posts_by_number = {post["post_number"]: post for post in posts}
    issues = []
    for index, topic in enumerate(topic_analysis.get("topics") or []):
        if not isinstance(topic, dict):
            continue
        post_numbers = [int(post_number) for post_number in topic.get("post_numbers") or []]
        issue_posts = [posts_by_number[post_number] for post_number in post_numbers if post_number in posts_by_number]
        post_number_set = set(post_numbers)
        signal_counts = _count_signals(signals_by_post, post_number_set)
        issues.append(
            {
                "id": f"issue-{index + 1}",
                "label": str(topic.get("label") or f"Discussion around post #{post_numbers[0]}"),
                "description": str(topic.get("description") or ""),
                "status": _issue_status(topic, signal_counts),
                "confidence": min(1.0, 0.35 + len(post_numbers) * 0.06),
                "postNumbers": post_numbers,
                "signalCounts": signal_counts,
                "roleActivity": _merged_roles(issue_posts),
                "lastActivityAt": str(topic.get("last_activity_at") or ""),
            }
        )
    return issues[:8]


def _issue_status(topic: dict[str, Any], signal_counts: dict[str, int]) -> str:
    burn = topic.get("burn") if isinstance(topic.get("burn"), dict) else {}
    convergence = topic.get("convergence") if isinstance(topic.get("convergence"), dict) else {}
    if burn.get("label") == "burning":
        return "in_contention"
    if convergence.get("label") == "strong":
        return "resolved"
    if signal_counts.get("revision", 0) or signal_counts.get("resolution", 0):
        return "work_in_progress"
    if signal_counts.get("disagreement", 0) >= 2:
        return "in_contention"
    if sum(signal_counts.values()) >= 2:
        return "in_discussion"
    return "unknown"


def _position_events(
    posts: list[dict[str, Any]],
    signals_by_post: dict[int, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    posts_by_number = {post["post_number"]: post for post in posts}
    events = []
    for post_number, post_signals in signals_by_post.items():
        post = posts_by_number.get(post_number)
        for signal in post_signals:
            events.append(
                {
                    "postNumber": post_number,
                    "username": signal["username"],
                    "createdAt": signal["created_at"],
                    "category": signal["category"],
                    "evidence": signal["evidence"],
                    "roles": post["roles"] if post else [],
                }
            )
    events.sort(key=lambda event: int(event["postNumber"]))
    return events


def _phases(
    posts: list[dict[str, Any]],
    signals_by_post: dict[int, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    if not posts:
        return []
    sorted_posts = sorted(posts, key=lambda post: post["post_number"])
    phases = []
    for index, (label, phase_posts) in enumerate(_phase_ranges(sorted_posts)):
        post_numbers = {post["post_number"] for post in phase_posts}
        author_counts = Counter(post["username"] for post in phase_posts)
        phases.append(
            {
                "id": f"phase-{index + 1}",
                "label": label,
                "startDate": phase_posts[0]["created_at"] if phase_posts else "",
                "endDate": phase_posts[-1]["created_at"] if phase_posts else "",
                "postCount": len(phase_posts),
                "postStart": phase_posts[0]["post_number"] if phase_posts else 0,
                "postEnd": phase_posts[-1]["post_number"] if phase_posts else 0,
                "dominantAuthors": [username for username, _count in author_counts.most_common(3)],
                "signalCounts": _count_signals(signals_by_post, post_numbers),
            }
        )
    return phases


def _phase_ranges(posts: list[dict[str, Any]]) -> list[tuple[str, list[dict[str, Any]]]]:
    first_segment: list[dict[str, Any]] = []
    follow_up: list[dict[str, Any]] = []
    previous_day = _day_number(posts[0]["created_at"])
    in_follow_up = False
    for post in posts:
        current_day = _day_number(post["created_at"])
        if current_day - previous_day > 14:
            in_follow_up = True
        (follow_up if in_follow_up else first_segment).append(post)
        previous_day = current_day

    first_cut = math.ceil(len(first_segment) * 0.48)
    second_cut = math.ceil(len(first_segment) * 0.78)
    ranges = [
        ("Opening burst", first_segment[:first_cut]),
        ("Main debate", first_segment[first_cut:second_cut]),
        ("Slowdown and consolidation", first_segment[second_cut:]),
    ]
    populated = [(label, phase_posts) for label, phase_posts in ranges if phase_posts]
    if follow_up:
        populated.append(("Follow-up", follow_up))
    return populated


def _top_quote_targets(posts: list[dict[str, Any]], quote_counts: dict[int, int]) -> list[dict[str, Any]]:
    posts_by_number = {post["post_number"]: post for post in posts}
    targets = [
        {
            "postNumber": post_number,
            "username": posts_by_number.get(post_number, {}).get("username", "unknown"),
            "count": count,
        }
        for post_number, count in quote_counts.items()
    ]
    targets.sort(key=lambda target: (-int(target["count"]), int(target["postNumber"])))
    return targets[:10]


def _best_topic_label(bucket: dict[str, Any]) -> str:
    label_scores = bucket.get("label_scores")
    if isinstance(label_scores, Counter) and label_scores:
        return max(label_scores.items(), key=lambda item: (float(item[1]), len(item[0]), item[0].casefold()))[0]
    posts = bucket.get("posts") or []
    if posts:
        return f"Discussion around post #{posts[0]['post_number']}"
    return "Thread discussion"


def _topic_description(
    label: str,
    topic_posts: list[dict[str, Any]],
    signal_counts: Counter[str],
    disagreement_score: float,
    convergence: dict[str, Any],
    divergence: dict[str, Any],
) -> str:
    if not topic_posts:
        return "No source posts are attached to this topic yet."
    first_post = topic_posts[0]["post_number"]
    latest_post = topic_posts[-1]["post_number"]
    participants = len({post["username"] for post in topic_posts})
    signal_summary = _topic_signal_summary(signal_counts, disagreement_score, convergence, divergence)
    recent_sentence = _recent_label_sentence(label, topic_posts)
    scope = (
        f"Discussed across posts #{first_post}-#{latest_post} by {participants} "
        f"participant{'s' if participants != 1 else ''}."
    )
    if recent_sentence:
        return f"{scope} Recent framing: {recent_sentence} {signal_summary}"
    return f"{scope} {signal_summary}"


def _topic_signal_summary(
    signal_counts: Counter[str],
    disagreement_score: float,
    convergence: dict[str, Any],
    divergence: dict[str, Any],
) -> str:
    if disagreement_score >= 7:
        return "The latest signal mix points to unresolved disagreement."
    if divergence.get("label") in {"active", "watch"}:
        return "The latest signal mix still needs review before calling it settled."
    if convergence.get("label") in {"strong", "emerging"}:
        return "The latest signal mix points toward convergence."
    if signal_counts.get("question", 0):
        return "The latest signal mix is mostly clarification and open questions."
    return "The latest signal mix is low-burn but worth scanning for direction."


def _recent_label_sentence(label: str, topic_posts: list[dict[str, Any]]) -> str:
    label_terms = [
        term.casefold()
        for term in re.findall(r"[A-Za-z0-9][A-Za-z0-9_.-]*", label)
        if term.casefold() not in TOPIC_STOPWORDS
    ]
    for post in sorted(topic_posts, key=lambda item: item["post_number"], reverse=True):
        for sentence in _sentences(post["text"]):
            lower_sentence = sentence.casefold()
            if label_terms and not any(term in lower_sentence for term in label_terms):
                continue
            return _leading_excerpt(sentence)
    return ""


def _count_signals(
    signals_by_post: dict[int, list[dict[str, Any]]],
    post_numbers: set[int],
) -> dict[str, int]:
    counts = {category: 0 for category in SIGNAL_CATEGORIES}
    for post_number in post_numbers:
        for signal in signals_by_post.get(post_number, []):
            counts[signal["category"]] += 1
    return counts


def _merged_roles(posts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    roles_by_key = {}
    for post in posts:
        for role in post.get("roles") or []:
            if isinstance(role, dict):
                roles_by_key[f"{role.get('role')}:{role.get('pep_name')}"] = role
    return sorted(roles_by_key.values(), key=lambda role: str(role.get("role") or ""))


def _day_number(value: str) -> int:
    match = re.match(r"^(\d{4})-(\d{2})-(\d{2})", value)
    if not match:
        return 0
    year, month, day = (int(part) for part in match.groups())
    return year * 372 + month * 31 + day


def _topic_payload(
    bucket: dict[str, Any],
    posts: list[dict[str, Any]],
    signals_by_post: dict[int, list[dict[str, Any]]],
) -> dict[str, Any]:
    total_posts = max(1, len(posts))
    post_numbers = sorted(bucket["post_numbers"])
    topic_posts = sorted(bucket["posts"], key=lambda post: post["post_number"])
    label = _best_topic_label(bucket)
    signal_counts = Counter(signal["category"] for signal in bucket["signals"])
    disagreement_score = _disagreement_score(bucket, total_posts)
    priority_score = _priority_score(bucket, total_posts, disagreement_score)
    evidence_posts = _evidence_posts(topic_posts, signals_by_post)
    participant_stances = _participant_stances(topic_posts, signals_by_post)
    convergence = _convergence_payload(bucket, disagreement_score)
    divergence = _divergence_payload(bucket, disagreement_score)
    return {
        "id": _topic_id(label),
        "label": label,
        "description": _topic_description(label, topic_posts, signal_counts, disagreement_score, convergence, divergence),
        "priority_score": round(priority_score, 1),
        "recency_score": round(_recency_score(bucket, total_posts), 3),
        "disagreement_score": round(disagreement_score, 1),
        "burn": _burn_payload(disagreement_score),
        "post_numbers": post_numbers,
        "post_count": len(post_numbers),
        "thread_share": round(len(post_numbers) / total_posts, 3),
        "participant_count": len(bucket["participants"]),
        "participants": sorted(bucket["participants"], key=str.casefold),
        "last_activity_at": topic_posts[-1]["created_at"] if topic_posts else "",
        "last_post_number": topic_posts[-1]["post_number"] if topic_posts else 0,
        "signal_counts": {category: signal_counts.get(category, 0) for category in SIGNAL_CATEGORIES},
        "convergence": convergence,
        "divergence": divergence,
        "participant_stances": participant_stances,
        "evidence": evidence_posts,
        "next_actions": _next_actions(label, disagreement_score, convergence, divergence, participant_stances),
    }


def _priority_score(bucket: dict[str, Any], total_posts: int, disagreement_score: float) -> float:
    coverage = min(1.0, len(bucket["post_numbers"]) / max(1, total_posts) * 3.0)
    breadth = min(1.0, len(bucket["participants"]) / 5.0)
    interaction = min(
        1.0,
        (bucket["reply_count"] + bucket["quote_count"]) / max(1, len(bucket["post_numbers"]) * 2.5),
    )
    recency = _recency_score(bucket, total_posts)
    span = max(0, bucket["latest_index"] - bucket["first_index"])
    recurrence = min(1.0, span / max(1, total_posts - 1) + len(bucket["post_numbers"]) / total_posts)
    contention = disagreement_score / 10.0
    return 100 * (
        coverage * 0.25
        + breadth * 0.18
        + interaction * 0.16
        + recency * 0.23
        + recurrence * 0.1
        + contention * 0.08
    )


def _disagreement_score(bucket: dict[str, Any], total_posts: int) -> float:
    signals = bucket["signals"]
    post_index_by_number = {post["post_number"]: post["index"] for post in bucket["posts"]}
    weighted_disagreement = 0.0
    weighted_convergence = 0.0
    latest_disagreement = -1
    latest_convergence = -1
    disapprovers: set[str] = set()
    for signal in signals:
        index = post_index_by_number.get(signal["post_number"], 0)
        age_weight = 0.25 + 0.75 * _position_ratio(index, total_posts)
        category = signal["category"]
        if category == "disagreement":
            weighted_disagreement += 1.25 * age_weight
            latest_disagreement = max(latest_disagreement, index)
            disapprovers.add(signal["username"])
        elif category == "question":
            weighted_disagreement += 0.55 * age_weight
            latest_disagreement = max(latest_disagreement, index)
        elif category == "agreement":
            weighted_convergence += 0.7 * age_weight
            latest_convergence = max(latest_convergence, index)
        elif category in {"concession", "revision", "resolution"}:
            weighted_convergence += 1.35 * age_weight
            latest_convergence = max(latest_convergence, index)
        elif category == "progress":
            weighted_convergence += 0.45 * age_weight
            latest_convergence = max(latest_convergence, index)

    breadth = min(2.0, len(disapprovers) * 0.55)
    interaction = min(1.8, (bucket["reply_count"] + bucket["quote_count"]) * 0.18)
    unresolved = 1.0
    if latest_convergence >= latest_disagreement >= 0:
        unresolved = 0.45
    elif latest_disagreement >= 0 and latest_convergence >= 0:
        unresolved = 0.78

    raw = (weighted_disagreement + breadth + interaction - weighted_convergence * 0.82) * unresolved
    score = max(0.0, min(10.0, raw * 1.35))
    share = len(bucket["post_numbers"]) / max(1, total_posts)
    latest_ratio = _recency_score(bucket, total_posts)
    if share < 0.05:
        score = min(score, 4.0)
    elif share < 0.1:
        score = min(score, 6.4)
    if latest_ratio < 0.45:
        score = min(score, 5.0)
    return score


def _recency_score(bucket: dict[str, Any], total_posts: int) -> float:
    return _position_ratio(max(0, bucket["latest_index"]), total_posts)


def _position_ratio(index: int, total_posts: int) -> float:
    if total_posts <= 1:
        return 1.0
    return max(0.0, min(1.0, index / (total_posts - 1)))


def _participant_stances(
    topic_posts: list[dict[str, Any]],
    signals_by_post: dict[int, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    latest_by_user: dict[str, dict[str, Any]] = {}
    for post in topic_posts:
        delta = 0.0
        categories: list[str] = []
        evidence = ""
        for signal in signals_by_post.get(post["post_number"], []):
            categories.append(signal["category"])
            evidence = evidence or str(signal["evidence"])
            if signal["category"] == "agreement":
                delta += 1.0
            elif signal["category"] == "progress":
                delta += 0.45
            elif signal["category"] in {"concession", "revision", "resolution"}:
                delta += 0.8
            elif signal["category"] == "disagreement":
                delta -= 1.15
            elif signal["category"] == "question":
                delta -= 0.4
        if not categories:
            continue
        latest_by_user[post["username"]] = {
            "username": post["username"],
            "stance": _stance_label(delta),
            "score": round(delta, 2),
            "latest_post_number": post["post_number"],
            "latest_activity_at": post["created_at"],
            "evidence": evidence or _leading_excerpt(post["text"]),
            "signal_categories": sorted(set(categories)),
            "roles": post["roles"],
        }
    return sorted(
        latest_by_user.values(),
        key=lambda item: (_stance_rank(str(item["stance"])), -int(item["latest_post_number"]), str(item["username"]).casefold()),
    )


def _stance_label(value: float) -> str:
    if value >= 1.35:
        return "strongly_approving"
    if value > 0.2:
        return "approving"
    if value <= -1.35:
        return "strongly_disapproving"
    if value < -0.2:
        return "disapproving"
    return "mixed"


def _stance_rank(value: str) -> int:
    order = {
        "strongly_disapproving": 0,
        "disapproving": 1,
        "mixed": 2,
        "approving": 3,
        "strongly_approving": 4,
    }
    return order.get(value, 2)


def _convergence_payload(bucket: dict[str, Any], disagreement_score: float) -> dict[str, Any]:
    counts = Counter(signal["category"] for signal in bucket["signals"])
    strength = counts["agreement"] + counts["concession"] * 1.5 + counts["revision"] + counts["resolution"] * 1.75
    label = "weak"
    if disagreement_score <= 3 and strength >= 2:
        label = "strong"
    elif strength >= 1:
        label = "emerging"
    return {"label": label, "score": round(min(10.0, strength * 1.7), 1)}


def _divergence_payload(bucket: dict[str, Any], disagreement_score: float) -> dict[str, Any]:
    counts = Counter(signal["category"] for signal in bucket["signals"])
    label = "low"
    if disagreement_score >= 7:
        label = "burning"
    elif disagreement_score >= 5:
        label = "active"
    elif counts["disagreement"] or counts["question"]:
        label = "watch"
    return {"label": label, "score": round(disagreement_score, 1)}


def _burn_payload(score: float) -> dict[str, Any]:
    if score >= 7:
        label = "burning"
        note = "Recent unresolved disagreement needs review."
    elif score >= 5:
        label = "hot"
        note = "Active divergence is present but not dominant."
    elif score >= 3:
        label = "warm"
        note = "Some disagreement remains visible."
    else:
        label = "cool"
        note = "No strong current disagreement signal."
    return {"label": label, "emoji": "🔥", "percent": round(score * 10), "note": note}


def _evidence_posts(
    topic_posts: list[dict[str, Any]],
    signals_by_post: dict[int, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    recent_posts = sorted(topic_posts, key=lambda post: post["post_number"], reverse=True)
    evidence: list[dict[str, Any]] = []
    for post in recent_posts:
        signals = signals_by_post.get(post["post_number"], [])
        evidence.append(
            {
                "post_number": post["post_number"],
                "username": post["username"],
                "created_at": post["created_at"],
                "excerpt": signals[0]["evidence"] if signals else _leading_excerpt(post["text"]),
                "signal_categories": sorted({signal["category"] for signal in signals}),
            }
        )
        if len(evidence) >= 5:
            break
    return evidence


def _next_actions(
    label: str,
    disagreement_score: float,
    convergence: dict[str, Any],
    divergence: dict[str, Any],
    stances: list[dict[str, Any]],
) -> list[str]:
    disapprovers = [stance for stance in stances if "disapproving" in str(stance["stance"])]
    approvers = [stance for stance in stances if "approving" in str(stance["stance"])]
    if disagreement_score >= 7:
        return [
            f"Review the newest objections on {label}.",
            "Ask whether a revision or explicit decision would resolve the active split.",
        ]
    if divergence["label"] in {"active", "watch"} and disapprovers:
        return [f"Check @{disapprovers[0]['username']}'s latest concern before treating {label} as settled."]
    if convergence["label"] in {"strong", "emerging"} and not disapprovers:
        return [f"Summarize the apparent convergence on {label} and confirm no late objections remain."]
    if approvers and disapprovers:
        return [f"Compare latest approving and disapproving posts for {label}."]
    return [f"Skim the newest source posts for {label} to decide whether it still needs attention."]


def _overview_summary(topics: list[dict[str, Any]]) -> str:
    if not topics:
        return "No recurring source-linked topics were detected yet."
    burning = [topic for topic in topics if topic["burn"]["label"] == "burning"]
    if burning:
        return f"{burning[0]['label']} is the most urgent active disagreement."
    hot = [topic for topic in topics if topic["burn"]["label"] in {"hot", "warm"}]
    if hot:
        return f"{hot[0]['label']} has the clearest remaining divergence."
    return f"{topics[0]['label']} is the most active recent topic, with no high burn signal."


def _quoted_post_counts(posts: list[dict[str, Any]]) -> dict[int, int]:
    counts: dict[int, int] = defaultdict(int)
    for post in posts:
        for match in re.finditer(r'data-post="(\d+)"', post["cooked"]):
            counts[int(match.group(1))] += 1
    return dict(counts)


def _topic_mentions_for_text(text: str) -> list[dict[str, Any]]:
    mentions: list[dict[str, Any]] = []
    for sentence in _sentences(text):
        mentions.extend(_technical_topic_mentions(sentence))
        mentions.extend(_phrase_topic_mentions(sentence))

    best_by_label: dict[str, dict[str, Any]] = {}
    for mention in mentions:
        label = str(mention["label"])
        current = best_by_label.get(label)
        if current is None or float(mention["score"]) > float(current["score"]):
            best_by_label[label] = mention

    ordered = sorted(
        best_by_label.values(),
        key=lambda mention: (-float(mention["score"]), str(mention["label"]).casefold()),
    )
    return ordered[:5]


def _technical_topic_mentions(sentence: str) -> list[dict[str, Any]]:
    tokens = _topic_tokens(sentence)
    if not tokens:
        return []
    mentions: list[dict[str, Any]] = []
    for term in _technical_terms(sentence):
        term_key = term.casefold()
        term_indexes = [index for index, token in enumerate(tokens) if token["normalized"] == term_key]
        if not term_indexes:
            continue
        index = term_indexes[0]
        descriptors = _nearby_descriptors(tokens, index)
        label = _technical_label(term, descriptors)
        mentions.append(
            {
                "key": term_key,
                "label": label,
                "score": 1.0 if not descriptors else 4.0 + min(2.5, len(descriptors) * 0.7),
            }
        )
        mentions.append(
            {
                "key": term_key,
                "label": f"{_term_label(term)} discussion",
                "score": 0.15,
            }
        )
    return mentions


def _phrase_topic_mentions(sentence: str) -> list[dict[str, Any]]:
    tokens = [
        token
        for token in _topic_tokens(sentence)
        if _is_label_word(token["normalized"])
        and token["normalized"] not in LABEL_FILLER_WORDS
        and token["normalized"] not in SIGNAL_WORDS
    ]
    mentions: list[dict[str, Any]] = []
    used_keys: set[str] = set()
    for size in range(5, 1, -1):
        for index in range(0, max(0, len(tokens) - size + 1)):
            phrase_tokens = tokens[index : index + size]
            normalized = [str(token["normalized"]) for token in phrase_tokens]
            if any("." in token or "_" in token or "-" in token for token in normalized):
                continue
            if len(set(normalized)) < min(2, size):
                continue
            key_tokens = _phrase_key_tokens(normalized)
            if len(key_tokens) < 2:
                continue
            if any(token in used_keys for token in key_tokens):
                continue
            label_tokens = normalized[:MAX_TOPIC_LABEL_WORDS]
            label = _phrase_label(" ".join(label_tokens))
            mentions.append(
                {
                    "key": " ".join(key_tokens),
                    "label": label,
                    "score": 2.0 + size * 0.35,
                }
            )
            used_keys.update(key_tokens)
    return mentions[:6]


def _technical_terms(text: str) -> list[str]:
    terms = re.findall(
        r"\b(?:[a-z][a-z0-9_-]*\.(?:json|toml|lock)|[a-z0-9]+-[a-z0-9_-]+|[a-z][a-z0-9_-]*_[a-z0-9_-]*|[A-Z]{2,})\b",
        text,
    )
    unique: list[str] = []
    for term in terms:
        if term.casefold() in GENERIC_TECH_TERM_KEYS or term in unique:
            continue
        unique.append(term)
    return unique[:3]


def _term_label(term: str) -> str:
    if "." in term or "_" in term or "-" in term:
        return term
    if term.upper() == term or any(character.isupper() for character in term[1:]):
        return term
    return " ".join(part.capitalize() for part in re.split(r"[._-]+", term) if part)


def _phrase_label(phrase: str) -> str:
    return " ".join(_display_word(word) for word in phrase.split())


def _technical_label(term: str, descriptors: list[str]) -> str:
    display_term = _term_label(term)
    if not descriptors:
        return f"{display_term} discussion"
    display_descriptors = [_display_word(descriptor) for descriptor in descriptors[:3]]
    return " ".join([display_term, *display_descriptors])


def _display_word(word: str) -> str:
    if "." in word or "_" in word or "-" in word:
        return word
    if word.upper() == word or any(character.isupper() for character in word[1:]):
        return word
    return word.capitalize()


def _topic_tokens(text: str) -> list[dict[str, str]]:
    tokens = []
    for token in re.findall(r"[A-Za-z0-9][A-Za-z0-9_.-]*", text):
        cleaned = token.strip("._-")
        if cleaned:
            tokens.append({"raw": cleaned, "normalized": cleaned.casefold()})
    return tokens


def _nearby_descriptors(tokens: list[dict[str, str]], anchor_index: int) -> list[str]:
    start = max(0, anchor_index - 7)
    end = min(len(tokens), anchor_index + 8)
    ranked: list[tuple[int, int, str]] = []
    for index in range(start, end):
        if index == anchor_index:
            continue
        token = str(tokens[index]["normalized"])
        if not _is_label_word(token) or token in LABEL_FILLER_WORDS:
            continue
        ranked.append((abs(index - anchor_index), index, token))
    ranked.sort()
    selected = sorted(ranked[:3], key=lambda item: item[1])
    return [token for _distance, _index, token in selected]


def _phrase_key_tokens(tokens: list[str]) -> list[str]:
    compact = [_singularize_token(token) for token in tokens if _is_label_word(token)]
    if len(compact) < 2:
        return []
    return compact[:2]


def _is_label_word(token: str) -> bool:
    return (
        len(token) > 2
        and not token.isdigit()
        and token not in TOPIC_STOPWORDS
        and token.casefold() not in GENERIC_TECH_TERM_KEYS
    )


def _singularize_token(token: str) -> str:
    if len(token) > 4 and token.endswith("ies"):
        return f"{token[:-3]}y"
    if len(token) > 4 and token.endswith("s") and not token.endswith("ss"):
        return token[:-1]
    return token


def _post_text(post: dict[str, Any]) -> str:
    value = str(post.get("cooked") or post.get("raw") or "")
    value = re.sub(r"<aside\b[^>]*class=\"[^\"]*\bquote\b[\s\S]*?</aside>", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"<blockquote[\s\S]*?</blockquote>", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"<pre[\s\S]*?</pre>", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"<script[\s\S]*?</script>", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"<style[\s\S]*?</style>", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def _sentences(text: str) -> list[str]:
    return [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", text) if sentence.strip()]


def _excerpt_around(text: str, term: str) -> str:
    sentences = _sentences(text)
    if not sentences:
        return _leading_excerpt(text)
    term_lower = term.lower()
    for index, sentence in enumerate(sentences):
        if term_lower in sentence.lower():
            selected = [sentence]
            if len(" ".join(selected).split()) < 22 and index + 1 < len(sentences):
                selected.append(sentences[index + 1])
            if len(" ".join(selected).split()) < 22 and index > 0:
                selected.insert(0, sentences[index - 1])
            return _leading_excerpt(" ".join(selected))
    return _leading_excerpt(text)


def _leading_excerpt(text: str) -> str:
    words = text.split()
    if len(words) <= WORDS_PER_EXCERPT:
        return text
    return " ".join(words[:WORDS_PER_EXCERPT]).rstrip() + "..."


def _topic_id(label: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", label.casefold()).strip("-")
    return slug or "topic"


def _int(value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0
