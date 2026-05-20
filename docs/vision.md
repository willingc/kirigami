# Kirigami vision: understanding long PEP discussions on Discourse

Kirigami reorganizes and cuts dialogue. This document states the problem, the principles any solution must honor, and the experiences we want to enable—before committing to architecture or implementation.

The primary setting is [discuss.python.org](https://discuss.python.org), especially threads that debate Python Enhancement Proposals (PEPs). The same ideas apply to other long-running Discourse conversations.

## Current product direction

The current implementation is a **source-linked evidence dashboard**, not a generated consensus summary. For PEP threads it enriches Discourse posts with metadata from `peps.python.org`, tags PEP authors/sponsors/delegates when they can be matched to Discourse users, and visualizes deterministic signals for agreement, disagreement, questions, revisions, concessions, and resolution markers. Issue cards keep every source post visible and let readers filter locally by signal type using the colored bar or matching chips.

Generated whole-thread summaries, author-position prose, multi-thread PEP bundles, and official consensus detection remain roadmap items. The source post remains the authority.

---

## 1. The problem with long-running Discourse threads

PEP and packaging discussions on Discourse are valuable primary sources: they capture objections, compromises, and decisions that never appear in the PEP text alone. They are also difficult to use as sources of truth or synthesis.

### Scale and fragmentation

- A single PEP may span **multiple threads** (initial proposal, revised drafts, spin-offs). There is no single page that contains the whole debate.
- Individual threads routinely reach **hundreds of posts** and tens of thousands of words—far beyond comfortable reading in the web UI.
- Discourse loads posts in **pages** (~20 at a time). Reading chronologically means endless scrolling, waiting, and losing place.

### Structure that hides the argument

- Posts are **linear in time** but **non-linear in meaning**. A reply may address post #3 while appearing after post #200.
- **[Quote blocks](https://meta.discourse.org/t/discourse-replies-and-quotes/**) embed copies of earlier text. The same argument appears many times; the live thread repeats context you have already read.
- **Side threads** emerge (technical detours, tooling, adjacent PEPs). The main line of the PEP decision is easy to lose.

### Weak affordances for synthesis

- Search finds **mentions**, not **positions**. It does not tell you who argued for what or how the consensus shifted.
- There is no built-in **timeline of decisions** (“we agreed to drop field X in post 142”).
- **Author identity** is visible per post but not aggregated: seeing everything Brett Cannon or Paul Moore said requires manual filtering or external tools.
- Export is limited. Copy-paste loses metadata (post number, date, reply target). Bulk export is aimed at admins, not readers building an understanding of a PEP debate.

### Cost for different readers

| Reader need | Pain today |
|-------------|------------|
| Newcomer catching up | Overwhelmed; unclear where to start or stop |
| PEP author / delegate | Hard to ensure every objection was seen and addressed |
| Historian / implementer | Hard to reconstruct *why* the PEP reads the way it does |
| Tooling / automation | No stable, documented artifact to feed summarization or analysis |

### Why this matters for kirigami

Kirigami is not trying to replace Discourse or the PEP process. It is trying to make the **dialogue** legible: preserved, navigable, and cuttable—without severing the link back to each original message.

---

## 2. Principle: source messages remain first-class

Any kirigami solution **must** keep individual messages available as **source messages**—the authoritative text of what was said, in full, with provenance.

### What “source message” means

For each post in a thread, we retain (at minimum):

- **Identity:** post id, post number, topic id, URL (or stable anchor)
- **Author:** username (and display metadata when useful)
- **Time:** created_at (and updated_at if edited)
- **Body:** raw post content (Discourse markdown), not only HTML “cooked” output
- **Threading hints:** reply_to_post_number, quotes, and other structural cues needed to place the message in the conversation

### What we will not do

- Replace source messages with summaries in the only copy of the archive
- Collapse a thread into a single narrative with no way to open the underlying post
- Paraphrase in a way that cannot be checked against the original in one step

### How summaries relate to sources

Summaries (thread-level, author-level, or per-message) are **derived views**. They always point back to source message ids / post numbers. A reader can move from “summary claim” → “exact post(s)” in one action.

This principle supports trust, citation (“see post #47”), and future re-summarization when models or questions change.

---

## 3. Goal: summarization of the entire thread

We want to produce a **thread-level summary**: a readable overview of what the conversation was about and how it developed.

### Intent

- Answer: *What was debated? What were the main options? What concerns dominated? Was there convergence or ongoing disagreement?*
- Compress hundreds of posts into a narrative or structured outline that still reflects the **arc** of the discussion (opening proposal → challenges → revisions → closing themes).
- Suitable for someone who will not read every post but needs an honest map of the territory.

### Requirements

- Generated from the **full set of source messages** for that thread (or explicit subset with documented scope).
- Clearly labeled as **synthesis**, with metadata: thread title, date range, post count, model/method if automated.
- **Traceable**: major summary sections or bullets link to supporting post numbers (or ranges).
- **Versionable**: if the thread is re-fetched and new posts appear, the summary can be regenerated; old summary retained with `last_posted_at` or similar.

### Open design choices (for later iteration)

- One summary vs. phased summaries (e.g. by month or by “draft round”)
- Human-authored overview + machine draft
- Length tiers: executive summary vs. detailed outline

---

## 4. Goal: key-point summarization of each message

We want a **per-message key-point summary**: a short distillation of what that specific post contributes, not a rewrite of the whole thread.

### Intent

- Answer for post #*N*: *What is this person saying here, in one glance?*
- Support skimming: read key points in post order, then drill into full source only where needed.
- Make long posts (common in PEP threads) approachable without losing the option to read every word.

### Requirements

- **One key-point block per source message** (default), stored alongside—not instead of—the source.
- Key points capture: main claim, question, objection, agreement, or action item; not generic filler.
- Preserve **post number and author** on the key-point view so context is obvious.
- Traces to **exact source** (same id / anchor as §2).

### Relationship to thread summary

- Thread summary = holistic, cross-cutting.
- Message key points = local, sequential building blocks.
- Thread summary may be informed by key points, but must not orphan them: key points remain the granular index.

---

## 5. Goal: author-centric visualization

We want to **visualize everything said by a particular author** in a thread (or PEP-related thread bundle), in three coupled layers:

| Layer | Content |
|-------|---------|
| **Raw** | All source messages by that author, in time order, full `raw` text |
| **Author view summary** | One synthesis of that author’s overall position, themes, and shifts across their posts |
| **Per-message summaries** | Key-point summary for each of their posts (§4) |

### Intent

- PEP debates are often read through **who** said what (BDFL-delegate, spec author, skeptic, tool maintainer).
- A reader can study one voice without manually searching `@username` in Discourse.
- Compare **stated position** (author summary) against **exact wording** (raw) and **post-by-post evolution** (key points over time).

### Visualization (conceptual)

- **Author panel** or profile: select author → see timeline of their posts.
- Each post on the timeline: expandable **source** + inline **key points**; thread-level context optional (e.g. “replying to #12”).
- **Author summary** at top or side, updated when thread grows; links to posts cited in the summary.

### Scope

- Single thread first; later optionally **all threads for one PEP** with author filter across threads.
- Handle authors with few posts (summary may be short or deferred) vs. very active participants.

---

## 6. Goal: conversation-flow visualization

We want to **visualize the flow of the conversation** using timestamps and the structural flow of replies and quotes—not only a flat chronological list.

### Intent

- Answer: *When did activity peak? Where did the thread branch? Which posts anchored the longest sub-discussions?*
- Make **time** and **structure** visible together: not just “post 1, 2, 3…” but “this cluster replied to post 5 over three days.”

### Inputs

- **Timestamps** on each source message (`created_at`, optionally edited)
- **Reply links** (`reply_to_post_number` and Discourse reply metadata)
- **Quote references** parsed from markdown where possible
- Optional: like/read counts as weak signals of prominence (not substitutes for content)

### Visualization (conceptual)

- **Timeline view:** posts (or author bands) along a time axis; density shows busy periods.
- **Thread graph:** nodes = posts (or collapsed clusters); edges = reply-to or quote-to; layout by time or by tree depth.
- **Swimlanes by author:** who spoke when; reduces “wall of avatars” in long threads.
- **Bridge to summaries:** selecting a node shows source + key points; selecting a cluster may show a mini-summary of that branch.

### Success criteria

- A reader can identify **when** a decision or mood shift occurred and **which posts** to read first.
- Flow views remain **linked to source messages** (click node → full post #*n*).

---

## Cross-cutting themes

### PEP-specific, Discourse-general

The vision targets PEP discussions first (discover thread(s), long technical argument, link to peps.python.org). The **source-first, layered summaries, author and flow views** apply to any long Discourse thread kirigami ingests later.

### Kirigami “cut”

“Cut” means deliberate slices of dialogue: by author, by time window, by reply subtree, or by theme—not arbitrary truncation. Every cut must remain **reversible** to full source messages.

### Human in the loop

Summaries may be model-assisted, but the product assumes **verification** against sources is normal. Citations (post numbers) are a feature, not an implementation detail.

---

## Out of scope for this vision (for now)

- Replacing Discourse or commenting there
- Real-time sync or notifications
- Deciding PEP outcomes or voting
- Publishing summaries as official PEP text without community process

---

## Summary

| # | Need |
|---|------|
| 1 | Acknowledge why long Discourse threads (especially PEP threads) are hard to read and use |
| 2 | **Source messages** always available, full and citable |
| 3 | **Whole-thread** summarization with traceability |
| 4 | **Per-message** key-point summarization |
| 5 | **Author-centric** views: raw + author summary + per-message summaries |
| 6 | **Flow** views from timestamps and conversation structure |

Implementation plans, data schemas, and CLI design come **after** this vision stabilizes. Feedback on this document should refine *what* we are building for readers of PEP dialogue—not yet *how* every module is named.
