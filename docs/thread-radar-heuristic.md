# Thread Radar heuristic

Thread Radar is a source-linked navigation aid for long Discourse threads. It
does not decide consensus, infer private intent, or replace the source posts.
Its job is to answer a practical review question: where is the debate happening
now, who appears to be converging or diverging, and what should a reader inspect
next?

## Philosophy

- Source posts remain authoritative. Every topic, score, stance, and action must
  point back to post numbers.
- Recent movement matters more than old volume. A disagreement from the opening
  burst should fade if later posts revise, concede, or converge.
- Internal topic priority is not outrage. A high-priority topic is broad,
  recurring, interactive, and currently active. The UI does not display this as
  a competing per-topic score.
- Disagreement is current unresolved divergence. It should increase when recent
  posts include multiple participants objecting, questioning, quoting, or
  replying around the same topic. It should decrease when later posts show
  agreement, concessions, revisions, or resolution.
- Participant stance is latest-effective-position. A person who objected early
  but later accepted a revision should not be displayed as an active opponent.
- Small tangents stay small. A few intense posts should not dominate a large
  thread unless they represent a meaningful share of the discussion.
- The UI should turn analysis into action: inspect the newest contested posts,
  confirm convergence, resolve a specific objection, or summarize settled ground.

## Topic discovery and labels

The implementation is deterministic and inspectable. It combines source-derived
signals only:

- technical terms such as filenames, formats, acronyms, and hyphenated concepts;
- short key phrases extracted from the thread after removing stopwords and
  signal words;
- repeated co-occurrence of agreement, disagreement, questions, progress, and
  resolution signals;
- reply and quote attention, which marks posts that other participants engaged.

Labels must be self-contained phrases, not orphan terms. A bare token such as
`pylock.toml` is not enough when the current thread text supports a clearer
phrase such as `pylock.toml migration risk`. The analyzer therefore scores
candidate labels by combining the stable anchor with nearby descriptive words,
then boosts the most recent phrasing because recent framing is usually the best
guide to what still needs attention.

The label strategy is:

- group repeated mentions by a normalized source-derived anchor;
- generate candidate labels from nearby phrase context, not from a fixed issue
  taxonomy;
- prefer recent contextual labels over older generic labels;
- avoid signal-only labels such as "disagree" or "concern";
- skip unlabeled signal fragments instead of creating vague "post #N" topics.

Each topic also carries a two-sentence maximum description. The description
states the source span, participant breadth, latest framing, and current signal
mix. It exists to make the card understandable without opening the source post,
while still keeping source evidence one click away.

Labels and descriptions may still be imperfect. They must not come from a
domain-specific taxonomy unless a future feature provides a separately
configured, user-visible vocabulary.

## Internal priority ordering

Thread Radar ranks topics in decreasing review priority. This internal score
combines:

- topic coverage: the share of total thread posts attached to the topic;
- participant breadth: number of unique participants;
- interaction: replies, quotes, and quoted-source attention;
- recurrence: topic evidence spread across the thread rather than one isolated
  burst;
- recency: latest activity and recent-window activity;
- unresolved contention: current disagreement and questions that have not been
  overtaken by later convergence signals.

The top of Thread Radar should therefore point to recent, broad, interactive
debate before older or narrower issues.

This priority score is intentionally not shown as a topic-card badge. The card
shows a simple "Last discussed ..." recency label and the burn gauge, which is
the visible disagreement score.

## Disagreement and burn score

Each topic receives a `0-10` disagreement score and burn label:

- `0-2`: cool
- `3-4`: warm
- `5-6`: hot
- `7-10`: burning

The score rises with recent disagreement, multiple disapproving participants,
questions, direct replies, quotes, and lack of later resolution. The score is
dampened by agreement, concessions, revisions, resolution, and recency decay.

Two caps prevent misleading severity:

- a topic covering only a small share of a large thread cannot reach burning;
- disagreement concentrated in old posts is capped unless recent posts renew it.

## Stance

Participant stance is derived per topic from each participant's latest relevant
posts. Agreement and progress language moves stance toward approval.
Disagreement and unresolved questions move it toward disapproval. Concession,
revision, and resolution language soften prior opposition.

The UI groups people into:

- strongly approving
- approving
- mixed
- disapproving
- strongly disapproving

The most recent relevant post number is always retained so the stance can be
checked.

## UI principles

- The first tab is Thread Radar.
- The previous dashboard becomes Evidence Map.
- Cards must prioritize recent topics and current divergence/convergence.
- Cards should not show the internal priority score. They should show topic
  order, a clear Open Discussion action, plain recency text, and the burn gauge.
- Burn gauges should be compact, readable, and source-linked.
- Action text should be concrete and short.
- Rendering should stay lazy: inactive tabs should not render expensive source
  views, and topic cards should show only a compact evidence set by default.
- Loading states should make waiting explicit with skeletons or spinners.
- Responsive layouts must avoid nested card clutter and preserve readable text
  on narrow screens.

## Review checklist

Before considering the implementation complete, verify:

- `thread_analysis` and `conversation_analysis` are computed in the Python
  backend and returned by the topic document API.
- The frontend renders server analysis payloads and does not keep a duplicate
  analyzer or synthesize fallback Thread Radar topics.
- The enriched topic document is cached for 5 minutes with the existing API cache
  mechanism.
- Thread Radar is the first tab, and Dashboard has been renamed Evidence Map.
- Topic order favors recent active debate, not only total historical mentions.
- Burn scores decay after later convergence and cap tiny tangents.
- Participant stance uses latest relevant evidence.
- Every visible topic/stance/action links to source post evidence.
- Loading UI appears while the topic document is unavailable.
- Tests cover decay, tangent caps, latest stance, internal priority ordering,
  API payload, caching, and frontend labels.

## Source rendering

Thread Radar and Evidence Map source previews preserve Discourse cooked HTML.
External/source links open in a new tab with `noopener noreferrer`. Code blocks
preserve whitespace, scroll horizontally, and receive only lightweight syntax
coloring when Discourse did not already emit highlight spans. Extracted-code
lists such as `<pre><ol><li>...</li></ol></pre>` are converted back to plain
newline-separated code text before rendering, so wrapper HTML never appears in
the reader.
