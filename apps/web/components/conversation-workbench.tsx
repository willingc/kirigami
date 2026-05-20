"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from "react";
import { analyzeConversation, cookedHtml } from "@/topic/analysis";
import type {
  AuthorSummary,
  ConversationAnalysis,
  Phase,
  Signal,
  SignalCategory,
  TopicMeta,
  TopicPost,
} from "@/topic/types";
import { cn } from "@/lib/styles";

const numberFormatter = new Intl.NumberFormat("en");
const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
});

const categoryLabels: Record<SignalCategory, string> = {
  agreement: "Convergence evidence",
  disagreement: "Contested evidence",
  question: "Open questions",
  progress: "Progress markers",
};

const categoryNotes: Record<SignalCategory, string> = {
  agreement: "Language that suggests support, acceptance, or shared ground.",
  disagreement: "Language that suggests objections, risks, concern, or pushback.",
  question: "Posts that appear to ask for clarification or expose uncertainty.",
  progress: "Posts that mention proposals, revisions, next steps, or decisions.",
};

const postContextLabels: Record<SignalCategory, string> = {
  agreement: "Where it seems to converge",
  disagreement: "What remains contested",
  question: "Open question",
  progress: "Progress marker",
};

function sourcePostUrl(sourceUrl: string, postNumber: number): string {
  return `${sourceUrl.replace(/\/$/, "")}/${postNumber}`;
}

const workbenchTabs = [
  { id: "summary", label: "Summary" },
  { id: "path", label: "Reading path" },
  { id: "positions", label: "Evidence for agreement and disagreement" },
  { id: "voices", label: "Who shaped the discussion" },
  { id: "source", label: "Sources" },
] as const;

type WorkbenchTab = (typeof workbenchTabs)[number]["id"];

const pill =
  "rounded-full border border-kiri-line/80 bg-kiri-surface px-3 py-1.5 text-[0.83rem] font-bold text-kiri-muted no-underline";
const darkPill =
  "rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[0.83rem] font-bold text-[#dceae2]";
const panelText = "text-kiri-muted leading-relaxed";
const tabList =
  "mx-[clamp(20px,4vw,64px)] mt-4.5 flex flex-wrap gap-1.5 rounded-lg border border-kiri-ink/15 bg-kiri-hero/80 p-1.5 shadow-kiri-subtle max-sm:mx-2.5 max-sm:grid max-sm:grid-cols-1";
const tabButton =
  "min-h-[38px] min-w-0 rounded-lg border border-transparent px-3 py-2 text-left text-sm font-extrabold text-[#dceae2] enabled:cursor-pointer hover:bg-white/10";
const activeTabButton =
  "border-[#f5c06f]/90 bg-[#f5c06f] text-kiri-ink shadow-[0_8px_20px_rgba(0,0,0,0.14)] hover:bg-[#f5c06f]";
const sectionPanel =
  "max-w-full min-w-0 rounded-lg border border-kiri-line bg-[linear-gradient(180deg,#fbfdfb,#edf5f0)] shadow-kiri-subtle";
const drawerDetails =
  "max-w-full w-fit [&[open]]:w-full [&[open]>summary]:mb-2.5 [&[open]>summary]:border-kiri-accent [&[open]>summary]:bg-kiri-accent-soft";
const drawerSummary =
  "inline-flex min-h-[30px] cursor-pointer list-none items-center rounded-full border border-[#d7dfd9]/95 bg-kiri-soft px-3 py-1.5 text-[0.85rem] font-extrabold text-kiri-accent [&::-webkit-details-marker]:hidden";
const sourceOpenButton =
  "grid min-h-[34px] place-items-center whitespace-nowrap rounded-lg border border-kiri-accent/25 bg-kiri-accent px-3 text-[0.86rem] font-extrabold text-[#fbfffc] no-underline hover:bg-[#075f8d]";
const sourcePreviewBase =
  "grid max-w-full min-w-0 gap-3.5 border-t border-kiri-line bg-[linear-gradient(180deg,var(--surface-soft),#fff)] p-5.5";
const sourcePreviewByCategory: Partial<Record<SignalCategory, string>> = {
  agreement: "bg-[linear-gradient(180deg,#e2f3fb,#fbfdfb_42%)]",
  disagreement: "bg-[linear-gradient(180deg,var(--contest-soft),#fbfdfb_42%)]",
  question: "bg-[linear-gradient(180deg,var(--note-soft),#fbfdfb_42%)]",
  progress: "bg-[linear-gradient(180deg,var(--progress-soft),#fbfdfb_42%)]",
};
const signalSectionByCategory: Record<SignalCategory, string> = {
  agreement:
    "border-t-4 border-t-kiri-accent bg-[linear-gradient(180deg,#e2f3fb,#fbfdfb_42%)] [&_h3]:text-kiri-accent",
  disagreement:
    "border-t-4 border-t-kiri-contest bg-[linear-gradient(180deg,var(--contest-soft),#fbfdfb_42%)] [&_h3]:text-kiri-contest",
  question:
    "border-t-4 border-t-kiri-note bg-[linear-gradient(180deg,var(--note-soft),#fbfdfb_42%)] [&_h3]:text-kiri-note",
  progress:
    "border-t-4 border-t-kiri-progress bg-[linear-gradient(180deg,var(--progress-soft),#fbfdfb_42%)] [&_h3]:text-kiri-progress",
};
const postContextBorder: Record<SignalCategory, string> = {
  agreement: "border-l-kiri-accent",
  disagreement: "border-l-kiri-contest",
  question: "border-l-kiri-note",
  progress: "border-l-kiri-progress",
};
const SOURCE_SCROLL_OFFSET = 104;

export default function ConversationWorkbench({
  posts,
  meta,
}: {
  posts: TopicPost[];
  meta: TopicMeta;
}) {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("summary");
  const [activeSourcePost, setActiveSourcePost] = useState<number | null>(null);
  const sourceListRef = useRef<HTMLDivElement>(null);
  const sourceRegionRef = useRef<HTMLDivElement>(null);
  const isTimelineDraggingRef = useRef(false);
  const analysis = useMemo(() => analyzeConversation(posts), [posts]);
  const postsByNumber = useMemo(
    () => new Map(posts.map((post) => [post.post_number, post])),
    [posts],
  );
  const signalsByPost = useMemo(() => signalsGroupedByPost(analysis), [analysis]);
  const firstPost = posts[0];

  function scrollSourcePostIntoView(postNumber: number) {
    const target = document.getElementById(`post-${postNumber}`);
    if (!target) {
      return;
    }

    window.scrollTo({
      top: Math.max(
        0,
        window.scrollY + target.getBoundingClientRect().top - SOURCE_SCROLL_OFFSET,
      ),
      behavior: "auto",
    });
  }

  function handleSourcePostRequest(postNumber: number) {
    setActiveSourcePost(postNumber);
    scrollSourcePostIntoView(postNumber);
  }

  function selectWorkbenchTab(tabId: WorkbenchTab) {
    setActiveTab(tabId);
    if (tabId !== "source") {
      return;
    }
    setActiveSourcePost(posts[0]?.post_number ?? null);
  }

  useEffect(() => {
    if (activeTab !== "source" || posts.length === 0) {
      return;
    }

    let frame: number | null = null;
    const updateFromScroll = () => {
      frame = null;
      if (isTimelineDraggingRef.current) {
        return;
      }

      const sourceRegion = sourceRegionRef.current;
      const sourceList = sourceListRef.current;
      if (!sourceRegion || !sourceList) {
        return;
      }

      const regionRect = sourceRegion.getBoundingClientRect();
      if (regionRect.top > window.innerHeight || regionRect.bottom < 0) {
        return;
      }

      const anchorY = SOURCE_SCROLL_OFFSET + 18;
      const sourceItems =
        sourceList.querySelectorAll<HTMLElement>("[data-source-post]");
      let activePostNumber = posts[0]?.post_number ?? null;

      for (const item of sourceItems) {
        const itemTop = item.getBoundingClientRect().top;
        if (itemTop <= anchorY) {
          activePostNumber = Number(item.dataset.sourcePost);
        } else {
          break;
        }
      }

      if (activePostNumber !== null) {
        setActiveSourcePost((currentPostNumber) =>
          currentPostNumber === activePostNumber ? currentPostNumber : activePostNumber,
        );
      }
    };

    const handleScroll = () => {
      if (frame !== null) {
        return;
      }
      frame = requestAnimationFrame(updateFromScroll);
    };

    updateFromScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [activeTab, posts]);

  return (
    <main className="w-full max-w-full overflow-x-clip pb-[72px] max-sm:pb-12">
      <article className="w-full max-w-full min-w-0 overflow-x-clip">
        <header className="max-w-full min-w-0 overflow-hidden bg-[radial-gradient(circle_at_78%_12%,rgba(245,192,111,0.2),transparent_28%),linear-gradient(135deg,var(--hero)_0%,var(--hero-2)_58%,#5f4a35_100%)] px-[clamp(20px,4vw,64px)] py-11.5 max-sm:p-6">
          <h1 className="max-w-6xl text-[clamp(2.45rem,5vw,4.75rem)] leading-none font-black tracking-normal text-[#fbfffc] max-sm:text-[2.45rem]">
            {meta.title}
          </h1>
          <div
            className="mt-6.5 flex flex-wrap gap-2"
            aria-label="Conversation metrics"
          >
            <span className={pill}>
              {numberFormatter.format(analysis.metrics.posts)} posts
            </span>
            <span className={pill}>
              {numberFormatter.format(analysis.metrics.participants)} authors
            </span>
            <span className={pill}>
              {analysis.metrics.estimatedReadMinutes} min source read
            </span>
            <span className={pill}>
              {formatDate(analysis.metrics.firstPostAt)} to{" "}
              {formatDate(analysis.metrics.lastPostAt)}
            </span>
          </div>
          <div className="mt-4.5 flex flex-wrap gap-2">
            <a
              className="text-kiri-ink rounded-full border border-[#f5c06f] bg-[#f5c06f] px-3 py-1.5 text-[0.83rem] font-bold no-underline"
              href={meta.sourceUrl}
            >
              Open Discourse
            </a>
            <span className={darkPill}>Heuristic evidence, not conclusions</span>
          </div>
        </header>

        <nav className={tabList} aria-label="Conversation views" role="tablist">
          {workbenchTabs.map((tab) => (
            <button
              aria-controls={`panel-${tab.id}`}
              aria-selected={activeTab === tab.id}
              className={cn(tabButton, activeTab === tab.id && activeTabButton)}
              id={`tab-${tab.id}`}
              key={tab.id}
              onClick={() => selectWorkbenchTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div
          aria-labelledby={`tab-${activeTab}`}
          className="mt-4.5 max-w-full min-w-0 px-[clamp(20px,4vw,64px)] max-sm:px-2.5"
          id={`panel-${activeTab}`}
          role="tabpanel"
        >
          {activeTab === "summary" ? (
            <section className="mt-0 mb-12 grid gap-3.5 max-sm:gap-3" id="brief">
              <BriefBlock
                title="What this discussion is about"
                body={
                  firstPost
                    ? `The opening post introduces ${meta.title} and sets up the discussion that follows.`
                    : "The source data did not include an opening post."
                }
                post={firstPost}
                sourceUrl={meta.sourceUrl}
                signalsByPost={signalsByPost}
              />
              <BriefBlock
                title="Where it seems to converge"
                body="The strongest convergence evidence is not treated as consensus. It is a shortlist of posts whose wording suggests agreement, support, or acceptance."
                signals={analysis.signals.agreement.slice(0, 3)}
                postsByNumber={postsByNumber}
                sourceUrl={meta.sourceUrl}
                signalsByPost={signalsByPost}
              />
              <BriefBlock
                title="What remains contested"
                body="The strongest contested evidence is a shortlist of posts that appear to carry concern, objection, risk, or pushback language."
                signals={analysis.signals.disagreement.slice(0, 3)}
                postsByNumber={postsByNumber}
                sourceUrl={meta.sourceUrl}
                signalsByPost={signalsByPost}
              />
            </section>
          ) : null}

          {activeTab === "path" ? (
            <GuidedSection
              id="path"
              title={`Read the thread in ${analysis.phases.length} ${
                analysis.phases.length === 1 ? "phase" : "phases"
              }`}
              intro="Phase boundaries are estimated from the thread's posting rhythm and source activity."
            >
              <div className="border-kiri-line shadow-kiri-subtle mt-6 grid gap-0 overflow-hidden rounded-lg border bg-[linear-gradient(180deg,#f7fbf8,#edf5f0)]">
                {analysis.phases.map((phase) => (
                  <PhaseStep
                    key={phase.id}
                    phase={phase}
                    postsByNumber={postsByNumber}
                    sourceUrl={meta.sourceUrl}
                    signalsByPost={signalsByPost}
                  />
                ))}
              </div>
            </GuidedSection>
          ) : null}

          {activeTab === "positions" ? (
            <GuidedSection
              id="positions"
              title="Evidence for agreement and disagreement"
              intro="These sections are intentionally restrained: they point to likely evidence, then let the source post carry the argument."
            >
              <div className="mt-6 grid grid-cols-2 gap-3.5 max-lg:grid-cols-1">
                <SignalSection
                  analysis={analysis}
                  category="agreement"
                  postsByNumber={postsByNumber}
                  sourceUrl={meta.sourceUrl}
                  signalsByPost={signalsByPost}
                  limit={6}
                />
                <SignalSection
                  analysis={analysis}
                  category="disagreement"
                  postsByNumber={postsByNumber}
                  sourceUrl={meta.sourceUrl}
                  signalsByPost={signalsByPost}
                  limit={6}
                />
                <SignalSection
                  analysis={analysis}
                  category="question"
                  postsByNumber={postsByNumber}
                  sourceUrl={meta.sourceUrl}
                  signalsByPost={signalsByPost}
                  limit={5}
                />
                <SignalSection
                  analysis={analysis}
                  category="progress"
                  postsByNumber={postsByNumber}
                  sourceUrl={meta.sourceUrl}
                  signalsByPost={signalsByPost}
                  limit={5}
                />
              </div>
            </GuidedSection>
          ) : null}

          {activeTab === "voices" ? (
            <GuidedSection
              id="voices"
              title="Who shaped the discussion"
              intro="Author rows stay compact until opened. Each expanded row shows the author's post cadence and the first few source messages."
            >
              <div className="mt-6 grid gap-3.5">
                {analysis.authors.slice(0, 10).map((author) => (
                  <AuthorRow
                    author={author}
                    key={author.username}
                    posts={posts.filter((post) => post.username === author.username)}
                    sourceUrl={meta.sourceUrl}
                    signalsByPost={signalsByPost}
                  />
                ))}
              </div>
            </GuidedSection>
          ) : null}

          {activeTab === "source" ? (
            <GuidedSection
              id="source"
              title="Source messages remain available"
              intro="The full thread is preserved below with source messages expanded and a fixed timeline for jumping through the discussion."
            >
              <div
                className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,190px)] items-start gap-4.5 max-lg:grid-cols-1"
                ref={sourceRegionRef}
              >
                <div
                  className="grid max-w-full min-w-0 gap-3.5 pr-1.5 [overflow-anchor:none]"
                  id="source-list"
                  ref={sourceListRef}
                >
                  {posts.map((post) => (
                    <SourceMessage
                      expanded
                      key={post.id}
                      post={post}
                      sourceUrl={meta.sourceUrl}
                      signals={signalsByPost.get(post.post_number)}
                    />
                  ))}
                </div>
                <SourceTimeline
                  activePostNumber={activeSourcePost}
                  onDragEnd={() => {
                    isTimelineDraggingRef.current = false;
                  }}
                  onDragStart={() => {
                    isTimelineDraggingRef.current = true;
                  }}
                  onPostRequest={handleSourcePostRequest}
                  posts={posts}
                  sourceListRef={sourceListRef}
                />
              </div>
            </GuidedSection>
          ) : null}
        </div>
      </article>
    </main>
  );
}

function BriefBlock({
  title,
  body,
  post,
  signals,
  postsByNumber,
  sourceUrl,
  signalsByPost,
}: {
  title: string;
  body: string;
  post?: TopicPost;
  signals?: Signal[];
  postsByNumber?: Map<number, TopicPost>;
  sourceUrl: string;
  signalsByPost: Map<number, Signal[]>;
}) {
  const blockTone =
    title === "Where it seems to converge"
      ? "border-l-kiri-progress bg-[linear-gradient(135deg,var(--progress-soft)_0%,#fbfdfb_76%)]"
      : title === "What remains contested"
        ? "border-l-kiri-contest bg-[linear-gradient(135deg,var(--contest-soft)_0%,#fbfdfb_76%)]"
        : "border-l-kiri-accent bg-[linear-gradient(135deg,#e8f5fa_0%,#fbfdfb_76%)]";

  return (
    <section
      className={cn(
        "border-kiri-line shadow-kiri-subtle grid min-w-0 content-start gap-3.5 rounded-lg border border-l-[5px] p-6.5 max-sm:p-4.5",
        blockTone,
      )}
    >
      <h2 className="text-2xl leading-tight font-black tracking-normal">{title}</h2>
      {signals && postsByNumber ? (
        <ul className="grid gap-3 pl-4.5">
          {signals.map((signal) => {
            const sourcePost = postsByNumber.get(signal.postNumber);
            return sourcePost ? (
              <li
                className="border-kiri-line/45 grid gap-2.5 rounded-lg border bg-white/65 px-3.5 py-3"
                key={`${signal.category}-${signal.postNumber}`}
              >
                <div className="grid gap-1.5">
                  <strong className="text-kiri-ink text-sm font-black">
                    @{signal.username}
                  </strong>
                  <EvidenceText value={signal.evidence} />
                </div>
                <EvidenceDrawer
                  label={`#${signal.postNumber}`}
                  post={sourcePost}
                  sourceUrl={sourceUrl}
                  signal={signal}
                  signals={signalsByPost.get(signal.postNumber)}
                />
              </li>
            ) : null;
          })}
        </ul>
      ) : (
        <p className={panelText}>{body}</p>
      )}
      {post ? (
        <EvidenceDrawer
          label={`#${post.post_number}`}
          post={post}
          sourceUrl={sourceUrl}
          signals={signalsByPost.get(post.post_number)}
        />
      ) : null}
    </section>
  );
}

function GuidedSection({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t-0 py-11 first:pt-6" id={id}>
      <h2 className="text-2xl leading-tight font-black tracking-normal">{title}</h2>
      <p className="text-kiri-muted mt-2.5 max-w-[920px] leading-relaxed">{intro}</p>
      {children}
    </section>
  );
}

function PhaseStep({
  phase,
  postsByNumber,
  sourceUrl,
  signalsByPost,
}: {
  phase: Phase;
  postsByNumber: Map<number, TopicPost>;
  sourceUrl: string;
  signalsByPost: Map<number, Signal[]>;
}) {
  const openingPost = postsByNumber.get(phase.postStart);
  const closingPost = postsByNumber.get(phase.postEnd);

  return (
    <section className="border-kiri-line/75 grid min-w-0 grid-cols-[84px_minmax(0,1fr)] gap-5.5 border-t bg-transparent px-7 py-6.5 first:border-t-0 max-sm:grid-cols-1 max-sm:p-3.5">
      <div className="border-kiri-accent/20 bg-kiri-accent-soft text-kiri-accent grid h-16 w-16 place-items-center rounded-lg border text-base font-black">
        {phase.postStart}
      </div>
      <div>
        <h3 className="text-[1.08rem] leading-tight font-black">{phase.label}</h3>
        <p className="text-kiri-muted mt-1.5 leading-relaxed">
          Posts #{phase.postStart}-#{phase.postEnd}, {phase.postCount} messages, led by{" "}
          {phase.dominantAuthors.map((author) => `@${author}`).join(", ")}.
        </p>
        <div className="my-3 flex flex-wrap gap-2">
          <span className={pill}>{phase.signalCounts.agreement} convergence</span>
          <span className={pill}>{phase.signalCounts.disagreement} contested</span>
          <span className={pill}>{phase.signalCounts.question} questions</span>
          <span className={pill}>{phase.signalCounts.progress} progress</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {openingPost ? (
            <EvidenceDrawer
              label={`Open #${phase.postStart}`}
              post={openingPost}
              sourceUrl={sourceUrl}
              signals={signalsByPost.get(openingPost.post_number)}
            />
          ) : null}
          {closingPost && closingPost.post_number !== openingPost?.post_number ? (
            <EvidenceDrawer
              label={`Close #${phase.postEnd}`}
              post={closingPost}
              sourceUrl={sourceUrl}
              signals={signalsByPost.get(closingPost.post_number)}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SignalSection({
  analysis,
  category,
  postsByNumber,
  sourceUrl,
  signalsByPost,
  limit,
}: {
  analysis: ConversationAnalysis;
  category: SignalCategory;
  postsByNumber: Map<number, TopicPost>;
  sourceUrl: string;
  signalsByPost: Map<number, Signal[]>;
  limit: number;
}) {
  const signals = analysis.signals[category].slice(0, limit);

  return (
    <section
      className={cn(
        sectionPanel,
        "p-5.5 max-sm:p-3.5",
        signalSectionByCategory[category],
      )}
    >
      <header className="flex items-start justify-between gap-3.5">
        <h3 className="text-[1.08rem] leading-tight font-black">
          {categoryLabels[category]}
        </h3>
        <span className="text-kiri-muted min-w-0 text-[0.82rem] font-extrabold [overflow-wrap:anywhere]">
          {analysis.signals[category].length} matches
        </span>
      </header>
      <p className="text-kiri-muted mt-2 text-[0.94rem] leading-relaxed">
        {categoryNotes[category]}
      </p>
      <ol className="mt-4 grid list-none gap-3 p-0">
        {signals.map((signal) => {
          const sourcePost = postsByNumber.get(signal.postNumber);
          if (!sourcePost) {
            return null;
          }

          return (
            <li
              className="grid gap-2 border-t border-[#d7dfd9]/85 pt-3.5 first:border-t-0 first:pt-0 [&_p]:text-[0.94rem] [&_p]:leading-normal [&_p]:text-[#303733]"
              key={`${signal.category}-${signal.postNumber}`}
            >
              <EvidenceText value={signal.evidence} />
              <EvidenceDrawer
                label={`#${signal.postNumber} · @${signal.username}`}
                post={sourcePost}
                sourceUrl={sourceUrl}
                signal={signal}
                signals={signalsByPost.get(signal.postNumber)}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function AuthorRow({
  author,
  posts,
  sourceUrl,
  signalsByPost,
}: {
  author: AuthorSummary;
  posts: TopicPost[];
  sourceUrl: string;
  signalsByPost: Map<number, Signal[]>;
}) {
  return (
    <details className={cn(sectionPanel, "[&>summary::-webkit-details-marker]:hidden")}>
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3.5 p-5.5 max-sm:flex-col">
        <span className="text-kiri-accent min-w-0 font-black [overflow-wrap:anywhere]">
          @{author.username}
        </span>
        <em className="text-kiri-muted min-w-0 text-sm font-bold [overflow-wrap:anywhere] not-italic">
          {author.posts} posts · {author.quotesReceived} quotes received
        </em>
      </summary>
      <div className="border-kiri-line border-t p-5.5">
        <p className={panelText}>
          Active from {formatDate(author.firstPostAt)} to{" "}
          {formatDate(author.lastPostAt)}. Heuristic signals:{" "}
          {author.signalCounts.agreement} convergence,{" "}
          {author.signalCounts.disagreement} contested, {author.signalCounts.question}{" "}
          questions, {author.signalCounts.progress} progress.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {posts.slice(0, 5).map((post) => (
            <EvidenceDrawer
              key={post.id}
              label={`#${post.post_number}`}
              post={post}
              sourceUrl={sourceUrl}
              signals={signalsByPost.get(post.post_number)}
            />
          ))}
        </div>
      </div>
    </details>
  );
}

function EvidenceDrawer({
  label,
  post,
  sourceUrl,
  signal,
  signals,
}: {
  label: string;
  post: TopicPost;
  sourceUrl: string;
  signal?: Signal;
  signals?: Signal[];
}) {
  return (
    <details className={drawerDetails}>
      <summary className={drawerSummary}>{label}</summary>
      <SourcePreview
        post={post}
        signal={signal}
        signals={signals}
        sourceUrl={sourceUrl}
      />
    </details>
  );
}

function SourceTimeline({
  posts,
  activePostNumber,
  onDragEnd,
  onDragStart,
  onPostRequest,
  sourceListRef,
}: {
  posts: TopicPost[];
  activePostNumber: number | null;
  onDragEnd: () => void;
  onDragStart: () => void;
  onPostRequest: (postNumber: number) => void;
  sourceListRef: RefObject<HTMLDivElement | null>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const lastDraggedPostRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const pendingRatioRef = useRef<number | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const positionFrameRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const timelinePanelRef = useRef<HTMLDivElement>(null);
  const firstPost = posts[0];
  const lastPost = posts.at(-1);
  const activeIndex = Math.max(
    0,
    posts.findIndex((post) => post.post_number === activePostNumber),
  );
  const activePost = posts[activeIndex] ?? firstPost;
  const progress = posts.length > 1 ? (activeIndex / (posts.length - 1)) * 100 : 0;
  const handleTop = Math.min(92, Math.max(0, progress));

  useEffect(() => {
    return () => {
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current);
      }
      if (positionFrameRef.current !== null) {
        cancelAnimationFrame(positionFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timelinePanel = timelinePanelRef.current;
    if (!timelinePanel) {
      return;
    }

    const updateTimelineTop = () => {
      positionFrameRef.current = null;
      const sourceList = sourceListRef.current;
      if (!sourceList) {
        timelinePanel.style.setProperty("--source-timeline-top", "92px");
        return;
      }

      const listTop = sourceList.getBoundingClientRect().top;
      timelinePanel.style.setProperty(
        "--source-timeline-top",
        `${Math.max(92, listTop)}px`,
      );
    };

    const scheduleTimelineTopUpdate = () => {
      if (positionFrameRef.current !== null) {
        return;
      }
      positionFrameRef.current = requestAnimationFrame(updateTimelineTop);
    };

    updateTimelineTop();
    window.addEventListener("scroll", scheduleTimelineTopUpdate, { passive: true });
    window.addEventListener("resize", scheduleTimelineTopUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleTimelineTopUpdate);
      window.removeEventListener("resize", scheduleTimelineTopUpdate);
      if (positionFrameRef.current !== null) {
        cancelAnimationFrame(positionFrameRef.current);
        positionFrameRef.current = null;
      }
    };
  }, [sourceListRef]);

  function dragRatio(clientY: number): number | null {
    const track = trackRef.current;
    if (!track || posts.length === 0) {
      return null;
    }

    const rect = track.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  }

  function applyTimelineRatio(ratio: number) {
    const postIndex = Math.round(ratio * (posts.length - 1));
    const post = posts[postIndex];
    if (!post) {
      return;
    }

    if (lastDraggedPostRef.current === post.post_number) {
      return;
    }

    lastDraggedPostRef.current = post.post_number;
    onPostRequest(post.post_number);
  }

  function scheduleTimelineScroll(clientY: number) {
    const ratio = dragRatio(clientY);
    if (ratio === null) {
      return;
    }

    pendingRatioRef.current = ratio;
    if (dragFrameRef.current !== null) {
      return;
    }

    dragFrameRef.current = requestAnimationFrame(() => {
      dragFrameRef.current = null;
      const pendingRatio = pendingRatioRef.current;
      if (pendingRatio === null) {
        return;
      }

      applyTimelineRatio(pendingRatio);
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
    onDragStart();
    setIsDragging(true);
    scheduleTimelineScroll(event.clientY);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) {
      return;
    }
    scheduleTimelineScroll(event.clientY);
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    isDraggingRef.current = false;
    lastDraggedPostRef.current = null;
    pendingRatioRef.current = null;
    if (dragFrameRef.current !== null) {
      cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
    onDragEnd();
    setIsDragging(false);
  }

  return (
    <aside
      className="w-[190px] min-w-0 self-start max-lg:order-first max-lg:w-auto"
      aria-label="Source timeline"
    >
      <div
        className="border-kiri-ink/20 bg-kiri-hero/85 shadow-kiri-subtle fixed top-[var(--source-timeline-top,92px)] right-[clamp(20px,4vw,64px)] z-30 grid h-[calc(100vh-116px)] max-h-[760px] min-h-[520px] w-[190px] max-w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-clip rounded-lg border px-4.5 py-7 max-lg:static max-lg:h-auto max-lg:min-h-[300px] max-lg:w-auto"
        ref={timelinePanelRef}
      >
        <button
          className="cursor-pointer border-0 bg-transparent p-0 text-left text-[0.96rem] font-bold text-[#b6c3bd]"
          onClick={() => {
            if (firstPost) {
              onPostRequest(firstPost.post_number);
            }
          }}
          type="button"
        >
          {formatMonth(firstPost?.created_at ?? "")}
        </button>
        <div
          aria-label={`Currently near post ${activeIndex + 1} of ${posts.length}, ${formatMonth(
            activePost?.created_at ?? "",
          )}`}
          className="relative my-5.5 mb-14 min-h-[420px] cursor-pointer touch-none select-none max-lg:min-h-[170px]"
          onPointerCancel={handlePointerEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          ref={trackRef}
        >
          <div className="bg-kiri-accent/70 absolute top-0 bottom-0 left-4 w-0.5" />
          <button
            aria-label={`Drag timeline marker. Currently near post ${activeIndex + 1} of ${posts.length}`}
            className={cn(
              "font-inherit absolute left-3 grid w-[calc(100%-12px)] min-w-0 translate-y-[-16px] cursor-grab gap-1 border-0 bg-transparent pl-7 text-left text-[#f8fbf8] will-change-[top]",
              isDragging && "cursor-grabbing",
            )}
            style={{ top: `${handleTop}%` }}
            type="button"
          >
            <span className="absolute top-px left-[-1px] h-16 w-3 rounded-full bg-[#4c9bd3]" />
            <strong className="min-w-0 text-[1.04rem] leading-tight font-black [overflow-wrap:anywhere]">
              {numberFormatter.format(activeIndex + 1)} /{" "}
              {numberFormatter.format(posts.length)}
            </strong>
            <span className="min-w-0 text-sm font-bold [overflow-wrap:anywhere] text-[#b6c3bd]">
              {formatMonth(activePost?.created_at ?? "")}
            </span>
          </button>
        </div>
        <button
          className="cursor-pointer border-0 bg-transparent p-0 text-left text-[0.96rem] font-bold text-[#b6c3bd]"
          onClick={() => {
            if (lastPost) {
              onPostRequest(lastPost.post_number);
            }
          }}
          type="button"
        >
          {formatMonth(lastPost?.created_at ?? "")}
        </button>
      </div>
    </aside>
  );
}

function SourceMessage({
  post,
  sourceUrl,
  signals,
  expanded = false,
}: {
  post: TopicPost;
  sourceUrl: string;
  signals?: Signal[];
  expanded?: boolean;
}) {
  return (
    <details
      className={cn(sectionPanel, "[&>summary::-webkit-details-marker]:hidden")}
      data-source-post={post.post_number}
      id={`post-${post.post_number}`}
      open={expanded}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3.5 p-5.5 max-sm:flex-col">
        <span className="text-kiri-accent min-w-0 font-black [overflow-wrap:anywhere]">
          #{post.post_number}
        </span>
        <strong className="min-w-0 font-extrabold [overflow-wrap:anywhere]">
          @{post.username}
        </strong>
        <em className="text-kiri-muted min-w-0 text-sm font-bold [overflow-wrap:anywhere] not-italic">
          {formatTime(post.created_at)}
        </em>
      </summary>
      <SourcePreview post={post} signals={signals} sourceUrl={sourceUrl} />
    </details>
  );
}

function SourcePreview({
  post,
  sourceUrl,
  signal,
  signals,
}: {
  post: TopicPost;
  sourceUrl: string;
  signal?: Signal;
  signals?: Signal[];
}) {
  const postSignals = summarizePostSignals(signal, signals);
  const primaryCategory = postSignals[0]?.category;

  return (
    <article
      className={cn(
        sourcePreviewBase,
        primaryCategory && sourcePreviewByCategory[primaryCategory],
      )}
    >
      <header className="flex items-start justify-between gap-3.5 max-sm:flex-col">
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <p className="text-kiri-ink font-extrabold">
            #{post.post_number} by @{post.username}
          </p>
          <time
            className="text-kiri-muted mt-1 block text-[0.88rem] font-bold"
            dateTime={post.created_at}
          >
            {formatTime(post.created_at)}
          </time>
        </div>
        <a
          className={sourceOpenButton}
          href={sourcePostUrl(sourceUrl, post.post_number)}
        >
          Open source
        </a>
      </header>

      {signal ? (
        <p className="border-kiri-line/80 bg-kiri-note-soft text-kiri-note w-fit rounded-full border px-3 py-1.5 text-[0.83rem] font-bold">
          Matched: {signal.matchedTerms.slice(0, 4).join(", ")}
        </p>
      ) : null}

      {postSignals.length > 0 ? (
        <dl className="grid gap-2" aria-label="Post formatting context">
          {postSignals.map((postSignal) => (
            <div
              className={cn(
                "border-kiri-line min-w-0 rounded-lg border border-l-[5px] bg-white/75 px-3.5 py-3",
                postContextBorder[postSignal.category],
              )}
              key={postSignal.category}
            >
              <dt className="text-kiri-ink text-[0.76rem] font-black uppercase">
                {postContextLabels[postSignal.category]}
              </dt>
              <dd className="mt-1 text-[0.94rem] leading-normal text-[#303733] [&>p]:m-0">
                <EvidenceText value={postSignal.evidence} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div
        className="discoursePost border-kiri-line bg-kiri-surface max-w-full min-w-0 rounded-lg border p-5.5 text-[0.98rem] leading-relaxed [overflow-wrap:anywhere] text-[#303733] max-sm:p-3.5"
        dangerouslySetInnerHTML={{ __html: cookedHtml(post) }}
      />
    </article>
  );
}

function EvidenceText({ value }: { value: string }) {
  if (looksLikeCodeEvidence(value)) {
    return (
      <pre className="border-kiri-line max-w-full overflow-auto rounded-lg border bg-[#202420] p-3 font-mono text-[0.82rem] leading-normal whitespace-pre text-[#f4f6f3]">
        <code>{formatFlattenedCode(value)}</code>
      </pre>
    );
  }

  return <p>{value}</p>;
}

function signalsGroupedByPost(analysis: ConversationAnalysis): Map<number, Signal[]> {
  const groupedSignals = new Map<number, Signal[]>();

  for (const category of Object.keys(analysis.signals) as SignalCategory[]) {
    for (const signal of analysis.signals[category]) {
      const existingSignals = groupedSignals.get(signal.postNumber) ?? [];
      groupedSignals.set(signal.postNumber, [...existingSignals, signal]);
    }
  }

  for (const [postNumber, postSignals] of groupedSignals) {
    groupedSignals.set(
      postNumber,
      postSignals.sort((left, right) => {
        const categoryDelta =
          categoryRank(left.category) - categoryRank(right.category);
        if (categoryDelta !== 0) {
          return categoryDelta;
        }
        return right.score - left.score;
      }),
    );
  }

  return groupedSignals;
}

function summarizePostSignals(signal?: Signal, signals: Signal[] = []): Signal[] {
  const byCategory = new Map<SignalCategory, Signal>();
  for (const postSignal of [signal, ...signals]) {
    if (!postSignal) {
      continue;
    }

    const existingSignal = byCategory.get(postSignal.category);
    if (!existingSignal || postSignal.score > existingSignal.score) {
      byCategory.set(postSignal.category, postSignal);
    }
  }

  return [...byCategory.values()].sort(
    (left, right) => categoryRank(left.category) - categoryRank(right.category),
  );
}

function categoryRank(category: SignalCategory): number {
  if (category === "agreement") {
    return 0;
  }
  if (category === "disagreement") {
    return 1;
  }
  if (category === "question") {
    return 2;
  }
  return 3;
}

function looksLikeCodeEvidence(value: string): boolean {
  const codeTokens = [
    "PyObject",
    "PyDict_",
    "Py_DECREF",
    "PyErr_",
    "static void",
    "static PyObject",
    "def ",
    "if __name__",
    "return ",
  ];
  const tokenMatches = codeTokens.filter((token) => value.includes(token)).length;
  const punctuationMatches = (value.match(/[{};()]/g) ?? []).length;

  return tokenMatches >= 1 && punctuationMatches >= 4;
}

function formatFlattenedCode(value: string): string {
  return value
    .replace(/^([a-zA-Z+#]+)\s+(?=static\s|def\s|class\s|if\s|from\s|import\s)/, "")
    .replace(/\s*(\{)\s*/g, " $1\n    ")
    .replace(/\s*(\})\s*/g, "\n}\n")
    .replace(/;\s*/g, ";\n    ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function formatDate(value: string): string {
  if (!value) {
    return "Unknown";
  }
  return dateFormatter.format(new Date(value));
}

function formatTime(value: string): string {
  if (!value) {
    return "Unknown";
  }
  return timeFormatter.format(new Date(value));
}

function formatMonth(value: string): string {
  if (!value) {
    return "Unknown";
  }
  return monthFormatter.format(new Date(value));
}
