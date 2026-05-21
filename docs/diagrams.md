# Vision diagrams

Excalidraw diagrams illustrate [Vision](vision.md). Published PNGs are on dedicated pages; source `.excalidraw` files remain editable in [Excalidraw](https://excalidraw.com) or Excalidraw+.

Current implementation note: the diagrams still include roadmap concepts such as generated summaries and full graph/swimlane views. The implemented reader is described in [Current NLP](nlp-current.md): PEP metadata enrichment, PEP role tags, Thread Radar, deterministic signal evidence, issue cards, and source-linked Evidence Map status.

## Diagram pages

| Page | Purpose |
|------|---------|
| [Overview](diagram-overview.md) | End-to-end: problem → source principle → ingest → `ThreadDocument` → derived views (§1–§6) |
| [Author and flow](diagram-author-flow.md) | Reader experiences: author panel (§5) and conversation flow (§6) |

## Source files

| File | Purpose |
|------|---------|
| [kirigami-vision.excalidraw](kirigami-vision.excalidraw) | Editable source for the overview diagram |
| [kirigami-vision-author-flow.excalidraw](kirigami-vision-author-flow.excalidraw) | Editable source for the author / flow diagram |

---

## Color legend

Colors are consistent across both diagrams. Fill is the box background; stroke is the border (usually a darker shade of the same hue).

| Fill | Stroke | Meaning |
|------|--------|---------|
| `#ffc9c9` | `#e03131` | **Problem / constraint** — pain points, hard requirements, “must link to post #” |
| `#b2f2bb` | `#2f9e44` | **Source / success** — first-class source messages, raw posts, success criteria |
| `#fff3bf` | `#f08c00` | **External input / time** — Discourse, timelines, author selection, human context |
| `#d0bfff` | `#7950f2` | **Processing** — acquire/fetch, swimlanes, system steps |
| `#96f2d7` | `#0ca678` | **Core data hub** — `ThreadDocument` (complete archive of source posts) |
| `#e7f5ff` | `#1971c2` | **Derived synthesis** — summaries and views built from sources (§3–§6) |
| `#ffec99` | `#e67700` | **Kirigami product** — “cut”, comparison callouts, human verification |
| `#f1f3f5` | `#868e96` | **Neutral / out of scope** — notes, scope limits, optional metadata |

### Timeline and graph accents (author-flow diagram only)

These appear on small nodes (ellipses) along the timeline or in sample graphs:

| Fill | Stroke | Typical use |
|------|--------|----------------|
| `#ffd8a8` | `#495057` | Early / opening posts (e.g. post #1) |
| `#ffc9c9` | `#495057` | Highlighted or pivotal posts |
| `#d0bfff` | `#495057` | Mid-thread activity |
| `#a5d8ff` | `#495057` | Later posts |
| `#ffffff` | `#1971c2` | Generic reply-graph nodes |

Stroke `#495057` on ellipses is neutral gray for small markers without assigning semantic category.

---

## Arrows and lines

| Style | Meaning |
|-------|---------|
| **Solid black** (`#1e1e1e`) | Primary flow: data movement, “feeds”, or reading order |
| **Solid green** (`#0ca678`) | Connection to shared `ThreadDocument` hub |
| **Solid blue** (`#1971c2`) | Reply-to edges in sample reply graph |
| **Dashed gray** (`#868e96`) | Optional, derived, or “informed by” (e.g. summary informed by posts above) |

Arrows point in the direction of dependency or reader drill-down (e.g. hub → derived views, summary → post #).

---

## Overview diagram (`kirigami-vision.excalidraw`)

Left-to-right flow:

1. **§1 Problem** (red) — why long PEP threads on Discourse are hard to use.
2. **§2 Source messages** (green) — non-negotiable: full posts with provenance; summaries cite post numbers.
3. **discuss.python.org** (yellow) → **Kirigami acquire** (purple) → **ThreadDocument** (teal).
4. **Derived views** (blue), all fed from the hub:
   - §3 Thread summary
   - §4 Per-message key points
   - §5 Author view
   - §6 Flow view
5. **Human verifies citations** and **Kirigami cut** (amber) — cross-cutting product behavior.
6. **Out of scope** (gray) — what kirigami is not trying to do.

Green **§2** also connects to **ThreadDocument** to show that the archive is the source-of-truth layer under all derived views.

---

## Author & flow diagram (`kirigami-vision-author-flow.excalidraw`)

Split canvas: **§5** (left) and **§6** (right), linked by a teal **ThreadDocument** bridge.

### §5 Author-centric visualization (left)

| Element | Color | Role |
|---------|-------|------|
| Select author | Yellow | Entry: filter by `@username` (one thread or PEP bundle) |
| Author view summary | Blue | Holistic synthesis of that author’s position |
| Post rows (×3) | Green | Per post: key points + expandable raw source |
| Compare callout | Amber | Compare summary vs raw vs evolution over time |
| Post # anchor | Red | Every layer must link to a post number |
| Scope note | Gray | Start with one thread; extend to all PEP threads later |

Dashed gray arrows: author summary informed by posts below.

### §6 Conversation-flow visualization (right)

| Element | Color | Role |
|---------|-------|------|
| Timeline header | Yellow | Time axis using `created_at` |
| Timeline dots | Accent fills | Example posts (#1, #12, #47, …) |
| Reply graph | Blue | Nodes = posts; edges = reply-to |
| Swimlanes | Purple | One lane per author over time |
| Inputs | Gray | Timestamps, `reply_to_post_number`, quote parsing |
| Success | Green | Find decision shifts; every node opens full post #*n* |

---

## Mapping to `vision.md`

| Vision section | Overview diagram | Author-flow diagram |
|----------------|------------------|---------------------|
| §1 Problem | Red box | — |
| §2 Source messages | Green box | Green post rows; red “post # anchor” |
| §3 Thread summary | Blue box | — |
| §4 Per-message key points | Blue box | Inside each green post row |
| §5 Author view | Blue box (summary) | Full left panel |
| §6 Flow view | Blue box | Full right panel |
| Cross-cutting: cut | Amber box | — |
| Cross-cutting: human in the loop | Amber box | Compare + verification |
| Out of scope | Gray box | Gray scope note |

---

## Regenerating PNGs

After editing a `.excalidraw` file, re-export PNGs from the repo root (requires [Node.js](https://nodejs.org/) and network for `npx`):

```bash
npx excalidraw2png convert docs/kirigami-vision.excalidraw \
  -o docs/images/kirigami-vision-overview.png --scale 2

npx excalidraw2png convert docs/kirigami-vision-author-flow.excalidraw \
  -o docs/images/kirigami-vision-author-flow.png --scale 2
```

Or run the helper script:

```bash
./scripts/export-diagrams.sh
```

Commit both the updated `.excalidraw` and `.png` files when diagram content changes.

## Editing tips

1. Load `.excalidraw` files from `docs/` in Excalidraw+.
2. Use **Frames** to group §5 / §6 on the author-flow canvas for cleaner exports.
3. Keep fill/stroke pairs aligned with the legend above so both diagrams stay visually consistent.
4. Regenerate PNGs and verify [Overview](diagram-overview.md) and [Author and flow](diagram-author-flow.md) in a local MkDocs build (`mkdocs serve`).

---

## Related documentation

- [Vision](vision.md) — full product vision (source of truth for diagram content)
- [Home](index.md) — kirigami introduction
