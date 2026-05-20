import type { Metadata } from "next";
import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import GitHubLink from "@/components/github-link";
import HowItWorksLink from "@/components/how-it-works-link";

export const metadata: Metadata = {
  title: "How it works | Kirigami",
  description: "How Kirigami uses deterministic NLP to map long technical discussions.",
};

const goals = [
  {
    title: "Find the shape of the discussion",
    body: "Long threads are hard because the important movement is distributed across dozens or hundreds of replies. Kirigami turns the thread into a map: opening context, agreement evidence, disagreement evidence, questions, progress, phases, authors, and source posts.",
    color: "border-t-[#07804f] bg-[#dff7e8]",
  },
  {
    title: "Separate evidence from conclusion",
    body: "The reader does not claim that a thread reached consensus. It identifies posts whose language looks like evidence for agreement, disagreement, uncertainty, or progress, then keeps the original source one click away.",
    color: "border-t-[#c7352b] bg-[#ffe0dc]",
  },
  {
    title: "Make review faster without hiding text",
    body: "The goal is compression for navigation, not replacement. Issue cards list every source post they use, and colored evidence controls filter the review list without removing access to the full source.",
    color: "border-t-kiri-progress bg-kiri-progress-soft",
  },
];

const process = [
  {
    title: "1. Clean the text",
    body: "Post HTML is stripped into plain text, whitespace is normalized, and code blocks plus headings are removed from signal detection. This avoids treating code snippets or section titles as participant intent.",
  },
  {
    title: "2. Detect discourse signals",
    body: "Each post is scanned for phrase families that usually mark agreement, disagreement, questions, progress, concessions, revisions, or resolution. A post can appear in more than one category because real discussion posts often do more than one thing.",
  },
  {
    title: "3. Extract the local evidence",
    body: "When a signal phrase is found, Kirigami extracts the sentence around it. If that sentence is too short to be meaningful, nearby sentences are included so the evidence is readable in context.",
  },
  {
    title: "4. Rank what deserves attention",
    body: "Signals are scored by the number of matched terms plus lightweight conversation structure: replies and quotes add weight because they suggest that other participants interacted with that post.",
  },
  {
    title: "5. Build the reading map",
    body: "The analysis groups posts by author, counts quoted targets, estimates reading time, groups evidence into issue cards, and divides the thread into phases using post order and large gaps in time.",
  },
  {
    title: "6. Keep source review filterable",
    body: "Issue cards show the complete set of source posts for that issue. Clicking a colored bar segment or matching colored chip filters those posts to agreement, disagreement, questions, progress, or other signal types; reset returns to the full list.",
  },
];

const examples = [
  {
    label: "Agreement",
    color: "border-t-[#07804f] bg-[#dff7e8]",
    chip: "bg-[#07804f] text-[#fbfffc]",
    trigger: "agree, consensus, support, makes sense, +1, no objection",
    example: "I agree with this direction; the revised wording makes sense.",
    result:
      "The post is surfaced as agreement evidence and can be found through green filters.",
  },
  {
    label: "Disagreement",
    color: "border-t-[#c7352b] bg-[#ffe0dc]",
    chip: "bg-[#c7352b] text-[#fbfffc]",
    trigger: "concern, objection, risk, not convinced, blocker, however, but",
    example: "I am not convinced this handles the compatibility risk.",
    result:
      "The post is surfaced as disagreement evidence and can be found through red filters.",
  },
  {
    label: "Question",
    color: "border-t-kiri-note bg-kiri-note-soft",
    chip: "bg-kiri-note text-[#2a2110]",
    trigger: "?, clarify, what about, how would, why, can you, does that",
    example: "Could we clarify how this behaves for existing users?",
    result: "The post is treated as an open question or uncertainty marker.",
  },
  {
    label: "Progress",
    color: "border-t-kiri-progress bg-kiri-progress-soft",
    chip: "bg-kiri-progress text-[#fbfffc]",
    trigger: "proposal, suggest, revised, decided, resolved, accept, conclusion",
    example: "The proposal was revised to remove the confusing case.",
    result: "The post is treated as a progress marker in the thread.",
  },
];

const nlpDetails = [
  {
    title: "Keyword and phrase matching",
    body: "This is deliberately simple NLP. The system uses curated phrase lists for discussion acts instead of asking a model to summarize intent. That makes the behavior inspectable and easy to correct.",
  },
  {
    title: "Sentence-window extraction",
    body: "Kirigami approximates sentence boundaries, finds the sentence containing the matched term, and expands to neighboring sentences when the extracted evidence would otherwise be too thin.",
  },
  {
    title: "Quote graph signals",
    body: "Discourse quote metadata identifies which posts were quoted by later replies. Frequently quoted posts are treated as structurally important, regardless of whether the quote is supportive or critical.",
  },
  {
    title: "Author and phase analysis",
    body: "Posts are grouped by author to show participation patterns. The thread is also split into phases using order plus time gaps, which helps distinguish the initial burst from later follow-up.",
  },
  {
    title: "Issue-level evidence filters",
    body: "The dashboard groups related evidence into issue cards. Each card lists all source posts it uses, and the colored signal bar plus matching chips filter that card's source list by evidence type.",
  },
  {
    title: "Reading-time estimation",
    body: "The plain text word count is divided by 220 words per minute. This gives a practical sense of source-reading cost before someone opens the full thread.",
  },
];

const scoring = [
  "Each matched phrase adds signal strength.",
  "Each reply adds a smaller amount of weight.",
  "Each quote adds a smaller amount of weight.",
  "Signals are sorted by score, then by post order.",
  "The score ranks review priority; it is not a confidence score.",
];

const nonGoals = [
  "No LLM summary is generated.",
  "No hidden intent is inferred.",
  "No semantic consensus decision is made.",
  "No claim is detached from its source post.",
  "No keyword match should be treated as proof by itself.",
];

const signalMap = [
  {
    label: "Agreement",
    value: "agree",
    className: "border-[#07804f] bg-[#dff7e8] text-[#05683f]",
  },
  {
    label: "Disagreement",
    value: "risk",
    className: "border-[#c7352b] bg-[#ffe0dc] text-[#9f241c]",
  },
  {
    label: "Question",
    value: "clarify?",
    className: "border-kiri-note bg-kiri-note-soft text-kiri-note",
  },
  {
    label: "Progress",
    value: "revised",
    className: "border-kiri-progress bg-kiri-progress-soft text-kiri-progress",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="text-kiri-ink min-h-screen w-full max-w-full overflow-x-clip bg-[#e4ede8]">
      <header className="bg-kiri-surface/85 border-kiri-line/70 shadow-kiri-subtle sticky top-0 z-50 flex w-full items-center justify-between gap-4 border-b px-[clamp(20px,4vw,64px)] py-3.5 backdrop-blur-md max-sm:px-2.5 max-sm:py-3">
        <BrandLogo />
        <div className="flex shrink-0 items-center gap-2 max-sm:gap-1.5">
          <HowItWorksLink className="text-kiri-ink shadow-kiri-subtle border-[#f5c06f] bg-[#f5c06f] hover:bg-[#ffd180] max-sm:min-h-10 max-sm:px-2.5 max-sm:text-sm" />
          <GitHubLink className="border-kiri-hero/20 bg-kiri-surface/80 text-kiri-hero shadow-kiri-subtle hover:bg-kiri-soft max-sm:min-h-10 max-sm:px-2.5 max-sm:text-sm [&_span]:max-sm:hidden" />
        </div>
      </header>

      <section className="bg-[#d4edf7] px-[clamp(20px,5vw,80px)] pt-14 pb-12 max-sm:px-4.5 max-sm:pt-9">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.62fr)]">
          <div>
            <p className="border-kiri-contest bg-kiri-contest mb-4 w-fit rounded-full px-3 py-2 text-[0.76rem] font-black text-[#fbfffc] uppercase shadow-[0_14px_28px_rgba(123,45,38,0.22)]">
              No LLMs. No generated consensus. Deterministic NLP only.
            </p>
            <h1 className="max-w-5xl text-[clamp(2.45rem,5.5vw,5.4rem)] leading-[0.98] font-black tracking-normal">
              Kirigami maps discussion signals without pretending to decide the debate.
            </h1>
            <div className="border-kiri-contest bg-kiri-contest-soft text-kiri-contest shadow-kiri-subtle mt-5 grid max-w-[900px] gap-1 rounded-lg border-l-[8px] p-4 font-black">
              <span className="text-[1.15rem] leading-tight">
                This page describes natural language processing rules, not AI
                summarization.
              </span>
              <span className="text-sm leading-normal">
                Kirigami scans text, matches phrases, extracts sentences, and ranks
                evidence. It does not ask an LLM what the thread means.
              </span>
            </div>
            <p className="text-kiri-muted mt-5 max-w-[900px] text-[1.08rem] leading-relaxed">
              The project uses lightweight natural language processing to make long
              technical discussions easier to inspect. It highlights likely evidence,
              keeps the surrounding sentence, and points back to the original post.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link
                className="border-kiri-hero bg-kiri-hero shadow-kiri-subtle inline-flex min-h-11 items-center rounded-lg border px-3.5 font-black text-[#fbfffc] no-underline hover:bg-[#075f8d]"
                href="/"
              >
                Try the reader
              </Link>
              <GitHubLink className="border-kiri-hero/20 bg-kiri-surface/80 text-kiri-hero shadow-kiri-subtle hover:bg-kiri-soft" />
            </div>
          </div>

          <div className="border-kiri-hero/15 shadow-kiri-card rounded-lg border bg-white/80 p-4.5">
            <div className="bg-kiri-hero rounded-lg p-4.5 text-[#fbfffc]">
              <p className="text-kiri-ink w-fit rounded-full bg-[#f5c06f] px-2.5 py-1.5 text-[0.72rem] font-black uppercase">
                Rule-based signal map
              </p>
              <div className="mt-4 grid gap-2.5">
                <div className="rounded-lg border border-white/15 bg-white/10 p-3">
                  <p className="text-sm font-bold text-[#dceae2]">Source sentence</p>
                  <p className="mt-1 leading-snug">
                    I agree with the direction, but can we clarify the migration risk?
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {signalMap.map((signal) => (
                    <div
                      className={`rounded-lg border p-3 ${signal.className}`}
                      key={signal.label}
                    >
                      <p className="text-[0.68rem] font-black uppercase">
                        {signal.label}
                      </p>
                      <p className="mt-1 font-mono text-sm font-black">
                        {signal.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-[#f5c06f]/40 bg-[#f5c06f]/15 p-3">
                  <span className="text-sm font-bold text-[#f8ead2]">
                    Rank by phrase matches, replies, and quotes
                  </span>
                  <span className="text-kiri-ink rounded-full bg-[#f5c06f] px-2.5 py-1 text-sm font-black">
                    4.45
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-[clamp(20px,5vw,80px)] pb-12 max-sm:px-2.5">
        <div className="grid gap-3.5 lg:grid-cols-3">
          {goals.map((goal) => (
            <article
              className={`border-kiri-line shadow-kiri-subtle rounded-lg border border-t-4 p-5.5 ${goal.color}`}
              key={goal.title}
            >
              <h2 className="text-kiri-hero text-[1.15rem] font-black">{goal.title}</h2>
              <p className="text-kiri-muted mt-2 leading-relaxed">{goal.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-kiri-hero px-[clamp(20px,5vw,80px)] py-12 text-[#fbfffc] max-sm:px-4.5">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-3 w-fit rounded-full border border-white/25 bg-white/10 px-2.5 py-1.5 text-[0.72rem] font-extrabold text-[#ccebdd] uppercase">
              How the goals are achieved
            </p>
            <h2 className="text-[clamp(2rem,4vw,3.8rem)] leading-[1.02] font-black">
              The reader turns a thread into a set of inspectable signals.
            </h2>
            <p className="mt-4 leading-relaxed text-[#dceae2]">
              The pipeline is intentionally conservative: clean text, identify discourse
              acts, extract local evidence, rank by interaction, and keep everything
              tied to source posts.
            </p>
          </div>
          <div className="grid gap-3">
            {process.map((step) => (
              <article
                className="rounded-lg border border-white/15 bg-white/12 p-4.5 shadow-[0_14px_32px_rgba(0,0,0,0.12)]"
                key={step.title}
              >
                <h3 className="text-[1rem] font-black">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-[#dceae2]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-[clamp(20px,5vw,80px)] py-12 max-sm:px-2.5">
        <div className="mb-5 max-w-3xl">
          <p className="border-kiri-hero/20 bg-kiri-hero/10 text-kiri-hero mb-3 w-fit rounded-full border px-2.5 py-1.5 text-[0.72rem] font-extrabold uppercase">
            NLP examples
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.8rem)] leading-[1.02] font-black">
            Examples of how posts are classified.
          </h2>
        </div>
        <div className="grid gap-3.5 lg:grid-cols-2">
          {examples.map((example) => (
            <article
              className={`border-kiri-line shadow-kiri-card rounded-lg border border-t-4 p-5.5 ${example.color}`}
              key={example.label}
            >
              <h3
                className={`w-fit rounded-full px-3 py-1.5 text-[0.8rem] font-black uppercase ${example.chip}`}
              >
                {example.label}
              </h3>
              <dl className="mt-4 grid gap-3">
                <div>
                  <dt className="text-kiri-muted text-[0.72rem] font-black uppercase">
                    Trigger phrases
                  </dt>
                  <dd className="mt-1 font-mono text-[0.9rem] leading-normal">
                    {example.trigger}
                  </dd>
                </div>
                <div>
                  <dt className="text-kiri-muted text-[0.72rem] font-black uppercase">
                    Example sentence
                  </dt>
                  <dd className="border-kiri-line mt-1 rounded-lg border bg-white/75 p-3 leading-relaxed">
                    {example.example}
                  </dd>
                </div>
                <div>
                  <dt className="text-kiri-muted text-[0.72rem] font-black uppercase">
                    Reader result
                  </dt>
                  <dd className="text-kiri-muted mt-1 leading-relaxed">
                    {example.result}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 px-[clamp(20px,5vw,80px)] pb-12 max-sm:px-2.5 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="border-kiri-line shadow-kiri-card rounded-lg border bg-white/80 p-5.5">
          <h2 className="text-[1.6rem] font-black">What “NLP” means here</h2>
          <div className="border-kiri-contest bg-kiri-contest shadow-kiri-subtle mt-4 rounded-lg border p-4 text-[#fbfffc]">
            <p className="text-[1.2rem] font-black">Not an LLM pipeline.</p>
            <p className="mt-1 leading-relaxed text-[#ffe0cc]">
              The analysis is transparent string processing and conversation structure:
              phrase lists, sentence windows, quote counts, author grouping, and time
              gaps.
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {nlpDetails.map((detail) => (
              <section
                className="border-kiri-line bg-kiri-surface rounded-lg border p-4"
                key={detail.title}
              >
                <h3 className="text-kiri-hero font-black">{detail.title}</h3>
                <p className="text-kiri-muted mt-2 leading-relaxed">{detail.body}</p>
              </section>
            ))}
          </div>
        </article>

        <div className="grid gap-6">
          <article className="border-kiri-line bg-kiri-soft shadow-kiri-card rounded-lg border p-5.5">
            <h2 className="text-[1.6rem] font-black">Ranking rules</h2>
            <ul className="mt-4 grid gap-3 pl-5">
              {scoring.map((rule) => (
                <li className="text-kiri-muted leading-relaxed" key={rule}>
                  {rule}
                </li>
              ))}
            </ul>
          </article>

          <article className="border-kiri-line bg-kiri-soft shadow-kiri-card rounded-lg border p-5.5">
            <h2 className="text-[1.6rem] font-black">What it does not do</h2>
            <ul className="mt-4 grid gap-3 pl-5">
              {nonGoals.map((nonGoal) => (
                <li className="text-kiri-muted leading-relaxed" key={nonGoal}>
                  {nonGoal}
                </li>
              ))}
            </ul>
            <div className="border-kiri-note bg-kiri-note-soft text-kiri-note mt-5 rounded-lg border p-4 font-bold">
              The output is a review map. The source thread remains the authority.
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
