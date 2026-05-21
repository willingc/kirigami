# Current NLP, Thread Radar, and PEP-aware evidence map

Kirigami currently uses deterministic NLP and source-linked metadata. It does not generate an official consensus summary and it does not infer hidden intent.

## Inputs

- A single discuss.python.org topic, fetched with all posts.
- Raw and cooked post content, post numbers, authors, timestamps, reply counts, quote counts, reads, and reply targets.
- If the topic title identifies a PEP, Kirigami fetches `https://peps.python.org/pep-{id}/` and extracts PEP metadata.
- PEP role fields include `Author`, `Sponsor` / `Sponsors`, `PEP-Delegate` / `PEP-Delegates`, and legacy `BDFL-Delegate` / `BDFL-Delegates`.

## People and role matching

PEP pages use real names, while Discourse uses usernames. Kirigami keeps a local people cache under `.cache/kirigami/discourse/people.sqlite` and matches PEP people to Discourse profiles with explicit confidence.

Role tags are shown only when a match is usable. Uncertain matches are marked with a question mark instead of being treated as confirmed.

Local aliases can be added at `.cache/kirigami/discourse/person-aliases.json`:

```json
{
  "Paul Moore": "pf_moore",
  "Sam Gross": "colesbury"
}
```

## Signal extraction

Each post is scanned for phrase families:

- agreement
- disagreement
- question
- progress
- concession
- revision
- resolution

Code blocks and headings are excluded from signal detection. For each match, Kirigami extracts a sentence window around the matched phrase and links back to the source post.

Scores rank review priority. They are based on matched phrase count plus lightweight interaction signals from replies and quotes. Scores are not confidence values.

## Thread Radar

Thread Radar and the Evidence Map analysis are computed in the Python backend
and returned as `thread_analysis` and `conversation_analysis` on the topic
document API. The enriched document is cached for 5 minutes through the existing
API cache. The frontend renders these payloads; it does not recompute signals,
issues, phases, participant summaries, or fallback Thread Radar topics.

Thread Radar groups source-linked discussed topics, orders them by internal
review priority, and emphasizes recent active debate. Topic labels are derived
from technical terms and short key phrases in the source text, not from a
hardcoded domain taxonomy. Labels are scored as self-contained phrases, so the
UI can show current framing such as a migration risk, syntax question, or
behavior concern instead of a bare term. Each topic also includes a compact
server-generated description with the source span, latest framing, and signal
mix. The internal priority score combines post coverage, participant breadth,
reply/quote interaction, recurrence, recency, and unresolved contention. It
sorts the cards but is not displayed as a separate topic score.

The visible topic card keeps the scoring simple: a plain "Last discussed ..."
recency label, an Open Discussion button, source evidence, and the burn gauge.

Each topic has a disagreement score from 0 to 10 and a flame burn gauge. Scores
above 7 are burning. The score decays when later agreement, concession,
revision, or resolution evidence overtakes earlier disagreement. Small tangents
are capped so a few heated posts cannot dominate a large thread.

Participant stance is latest-effective-position. Early opposition is softened or
replaced when a participant later approves, concedes, or accepts a revision.

The full design is documented in [Thread Radar heuristic](thread-radar-heuristic.md).

## Evidence Map status

The Evidence Map groups evidence into issue cards and assigns a status hypothesis:

- `resolved`
- `work_in_progress`
- `in_contention`
- `in_discussion`
- `stale`
- `unknown`

These labels are review aids. A PEP delegate, sponsor, author, or steering council decision remains authoritative only when linked to source text such as a PEP resolution or a Discourse post.

Issue cards expose the complete source-post set used for the issue. The post list is not truncated behind `+N more`; every referenced post has a review control. The colored signal bar and matching colored chips are interactive filters:

- green: agreement evidence
- red: disagreement evidence
- note color: open questions
- progress color: progress markers
- purple: concessions / position shifts
- teal: revision markers
- blue: resolution markers

Selecting a color filters the issue's review controls to posts with that signal type. The reset control clears the filter and restores the complete source-post list.

## Position over time

Kirigami tracks source-linked position events when posts contain support, concern, questions, concessions, revisions, or resolution language. This is designed to show that people can revise their position over time, especially PEP authors responding to objections.

The system preserves exact source posts so a reader can verify every tag, status, and position event.

## Source and code rendering

Source previews preserve Discourse cooked HTML in the Sources tab and Open
Discussion modal. Discourse, PEP, topic-feed, and embedded source links open in
a new tab with `noopener noreferrer`; internal app navigation remains normal.
Code blocks keep whitespace and use horizontal scrolling. Plain code receives
lightweight syntax coloring, existing Discourse highlight spans are preserved,
and extracted-code list wrappers are converted back to newline-separated code
text before rendering.
