# Current NLP and PEP-aware dashboard

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

## Dashboard status

The dashboard groups evidence into issue cards and assigns a status hypothesis:

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
