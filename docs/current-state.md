# Current state

Kirigami is now a source-first reader for long discuss.python.org topics, with PEP-aware enrichment when a thread is about a PEP.

## Implemented

- Fetch a Discourse topic and preserve full source posts.
- Display source messages with post numbers, authors, timestamps, cooked HTML, and links back to Discourse.
- Estimate reading cost and identify active authors.
- Detect deterministic discussion signals: agreement, disagreement, questions, progress, concessions, revisions, and resolution markers.
- Build Thread Radar from backend topic analysis: internally prioritized topics, recent convergence/divergence, burn scores, latest participant stance, and suggested next moves.
- Keep backend analysis as the source of truth; the frontend renders `thread_analysis` and `conversation_analysis` without a duplicate analyzer.
- Fetch PEP metadata from `peps.python.org` when a PEP number is known.
- Extract PEP authors, sponsors, and delegates, including legacy `BDFL-Delegate`.
- Match PEP real names to Discourse usernames through a local people cache and confidence-scored matching.
- Tag PEP authors, sponsors, and delegates in headers, author rows, Evidence Map cards, and source posts.
- Keep the older issue-level view as Evidence Map, with source-linked status hypotheses.
- Show every source post used by an issue card and allow local filtering by evidence type through the colored signal bar or matching chips.
- Preserve Discourse cooked HTML in source views and the Open Discussion modal, including whitespace-safe horizontally scrolling code blocks and source links that open in a new tab.

## Important limits

- Thread Radar and Evidence Map are review aids, not official consensus decisions.
- Thread Radar uses source-derived topic labels, not a hardcoded issue taxonomy.
- Evidence Map filters only narrow visible review controls inside one issue card; they do not change the underlying evidence or status hypothesis.
- Role matching is best-effort because PEP names and Discourse usernames may differ.
- Issue labels are deterministic and source-linked; they may be rough when discussion wording is broad.
- Generated thread summaries and author-position prose are not implemented yet.

## Next leverage points

1. Improve issue grouping beyond simple phrase clustering.
2. Add stronger role aliases for well-known PEP participants.
3. Add visual timelines that show author position changes by issue.
4. Add multi-topic PEP bundles once the single-topic Thread Radar is stable.
