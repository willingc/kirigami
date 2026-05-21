"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from "react";
import { cookedHtml, postText } from "@/topic/post-rendering";
import type {
  AuthorSummary,
  ConversationAnalysis,
  DiscussionIssue,
  Phase,
  PepMetadata,
  PepRoleTag,
  RoleMatch,
  Signal,
  SignalCategory,
  ThreadAnalysis,
  ThreadParticipantStance,
  ThreadTopic,
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
  agreement: "Agreement evidence",
  disagreement: "Disagreement evidence",
  question: "Open questions",
  progress: "Progress markers",
  concession: "Position shifts",
  revision: "Revision markers",
  resolution: "Resolution markers",
};

const categoryNotes: Record<SignalCategory, string> = {
  agreement: "Language that suggests support, acceptance, or shared ground.",
  disagreement: "Language that suggests objections, risks, concern, or pushback.",
  question: "Posts that appear to ask for clarification or expose uncertainty.",
  progress: "Posts that mention proposals, revisions, next steps, or decisions.",
  concession: "Posts that appear to concede, accept criticism, or change position.",
  revision: "Posts that appear to revise the PEP or proposal scope.",
  resolution: "Posts that appear to close or resolve part of the discussion.",
};

const postContextLabels: Record<SignalCategory, string> = {
  agreement: "Agreement",
  disagreement: "Disagreement",
  question: "Open question",
  progress: "Progress marker",
  concession: "Position shift",
  revision: "Revision marker",
  resolution: "Resolution marker",
};

function sourcePostUrl(sourceUrl: string, postNumber: number): string {
  return `${sourceUrl.replace(/\/$/, "")}/${postNumber}`;
}

const workbenchTabs = [
  { id: "radar", label: "Thread Radar" },
  { id: "evidence", label: "Evidence Map" },
  { id: "summary", label: "Signal summary" },
  { id: "path", label: "Reading path" },
  { id: "positions", label: "Evidence for agreement and disagreement" },
  { id: "voices", label: "Who shaped the discussion" },
  { id: "source", label: "Sources" },
] as const;

type WorkbenchTab = (typeof workbenchTabs)[number]["id"];

const pill =
  "max-w-full min-w-0 rounded-full border border-kiri-line/80 bg-kiri-surface px-3 py-1.5 text-[0.83rem] leading-tight font-bold text-kiri-muted no-underline [overflow-wrap:anywhere]";
const darkPill =
  "max-w-full min-w-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[0.83rem] leading-tight font-bold text-[#dceae2] [overflow-wrap:anywhere]";
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
  agreement: "bg-[linear-gradient(180deg,#dff7e8,#fbfdfb_42%)]",
  disagreement: "bg-[linear-gradient(180deg,#ffe0dc,#fbfdfb_42%)]",
  question: "bg-[linear-gradient(180deg,var(--note-soft),#fbfdfb_42%)]",
  progress: "bg-[linear-gradient(180deg,var(--progress-soft),#fbfdfb_42%)]",
  concession: "bg-[linear-gradient(180deg,#f6edff,#fbfdfb_42%)]",
  revision: "bg-[linear-gradient(180deg,#e4f7ee,#fbfdfb_42%)]",
  resolution: "bg-[linear-gradient(180deg,#dff3ff,#fbfdfb_42%)]",
};
const signalSectionByCategory: Record<SignalCategory, string> = {
  agreement:
    "border-t-4 border-t-[#07804f] bg-[linear-gradient(180deg,#dff7e8,#fbfdfb_42%)] [&_h3]:text-[#05683f]",
  disagreement:
    "border-t-4 border-t-[#c7352b] bg-[linear-gradient(180deg,#ffe0dc,#fbfdfb_42%)] [&_h3]:text-[#9f241c]",
  question:
    "border-t-4 border-t-kiri-note bg-[linear-gradient(180deg,var(--note-soft),#fbfdfb_42%)] [&_h3]:text-kiri-note",
  progress:
    "border-t-4 border-t-kiri-progress bg-[linear-gradient(180deg,var(--progress-soft),#fbfdfb_42%)] [&_h3]:text-kiri-progress",
  concession:
    "border-t-4 border-t-[#7a4cc2] bg-[linear-gradient(180deg,#f6edff,#fbfdfb_42%)] [&_h3]:text-[#6d3db5]",
  revision:
    "border-t-4 border-t-[#16834d] bg-[linear-gradient(180deg,#e4f7ee,#fbfdfb_42%)] [&_h3]:text-[#137244]",
  resolution:
    "border-t-4 border-t-[#0b6f9d] bg-[linear-gradient(180deg,#dff3ff,#fbfdfb_42%)] [&_h3]:text-[#075f8d]",
};
const postContextBorder: Record<SignalCategory, string> = {
  agreement: "border-l-[#07804f]",
  disagreement: "border-l-[#c7352b]",
  question: "border-l-kiri-note",
  progress: "border-l-kiri-progress",
  concession: "border-l-[#7a4cc2]",
  revision: "border-l-[#16834d]",
  resolution: "border-l-[#0b6f9d]",
};
const SOURCE_SCROLL_OFFSET = 104;

export default function ConversationWorkbench({
  posts,
  meta,
  pepMetadata,
  roleMatches = [],
  analysisWarnings = [],
  conversationAnalysis,
  threadAnalysis,
}: {
  posts: TopicPost[];
  meta: TopicMeta;
  pepMetadata?: PepMetadata | null;
  roleMatches?: RoleMatch[];
  analysisWarnings?: string[];
  conversationAnalysis: ConversationAnalysis;
  threadAnalysis: ThreadAnalysis;
}) {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("radar");
  const [activeSourcePost, setActiveSourcePost] = useState<number | null>(null);
  const sourceListRef = useRef<HTMLDivElement>(null);
  const sourceRegionRef = useRef<HTMLDivElement>(null);
  const isTimelineDraggingRef = useRef(false);
  const analysis = conversationAnalysis;
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
              rel="noopener noreferrer"
              target="_blank"
            >
              Open Discourse
            </a>
            <span className={darkPill}>Heuristic evidence, not conclusions</span>
            {pepMetadata ? (
              <a
                className={darkPill}
                href={pepMetadata.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                PEP {pepMetadata.number}
                {pepMetadata.status ? ` · ${pepMetadata.status}` : ""}
              </a>
            ) : null}
          </div>
          {roleMatches.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={darkPill}>{roleSummary(roleMatches)}</span>
              {unmatchedRoleCount(roleMatches) > 0 ? (
                <span className={darkPill}>
                  {unmatchedRoleCount(roleMatches)} role matches need review
                </span>
              ) : null}
            </div>
          ) : null}
          {analysisWarnings.length > 0 ? (
            <p className="mt-3 max-w-4xl rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-[#dceae2]">
              {analysisWarnings[0]}
            </p>
          ) : null}
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
          {activeTab === "radar" ? (
            <ThreadRadarSection
              postsByNumber={postsByNumber}
              sourceUrl={meta.sourceUrl}
              signalsByPost={signalsByPost}
              threadAnalysis={threadAnalysis}
            />
          ) : null}

          {activeTab === "evidence" ? (
            <EvidenceMapSection
              analysis={analysis}
              firstPost={firstPost}
              meta={meta}
              pepMetadata={pepMetadata}
              postsByNumber={postsByNumber}
              sourceUrl={meta.sourceUrl}
              signalsByPost={signalsByPost}
            />
          ) : null}

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
                <SignalSection
                  analysis={analysis}
                  category="concession"
                  postsByNumber={postsByNumber}
                  sourceUrl={meta.sourceUrl}
                  signalsByPost={signalsByPost}
                  limit={5}
                />
                <SignalSection
                  analysis={analysis}
                  category="revision"
                  postsByNumber={postsByNumber}
                  sourceUrl={meta.sourceUrl}
                  signalsByPost={signalsByPost}
                  limit={5}
                />
                <SignalSection
                  analysis={analysis}
                  category="resolution"
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
              intro="Author rows stay compact until opened. Each expanded row shows the author's post cadence, PEP role tags, and source messages."
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
                <SourcePostList
                  id="source-list"
                  posts={posts}
                  sourceListRef={sourceListRef}
                  sourceUrl={meta.sourceUrl}
                  signalsByPost={signalsByPost}
                />
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

function ThreadRadarSection({
  postsByNumber,
  sourceUrl,
  signalsByPost,
  threadAnalysis,
}: {
  postsByNumber: Map<number, TopicPost>;
  sourceUrl: string;
  signalsByPost: Map<number, Signal[]>;
  threadAnalysis: ThreadAnalysis;
}) {
  const visibleTopics = threadAnalysis.topics;

  return (
    <section className="grid gap-5 pb-12">
      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <div className={cn(sectionPanel, "grid gap-4 p-5.5 max-sm:p-3.5")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-kiri-muted text-[0.76rem] font-black uppercase">
                Recent debate map
              </p>
              <h2 className="mt-1 text-2xl leading-tight font-black tracking-normal">
                {threadAnalysis.overview.summary}
              </h2>
            </div>
            <span
              className={cn(
                "rounded-full border px-3 py-1.5 text-[0.82rem] font-black",
                threadAnalysis.overview.burning_count > 0
                  ? "border-[#c7352b]/35 bg-[#ffe0dc] text-[#9f241c]"
                  : "border-[#07804f]/35 bg-[#dff7e8] text-[#05683f]",
              )}
            >
              {threadAnalysis.overview.burning_count} burning
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <RadarMetric label="Topics" value={threadAnalysis.overview.topic_count} />
            <RadarMetric
              label="Recent"
              value={threadAnalysis.overview.recently_active_count}
            />
            <RadarMetric
              label="Highest burn"
              value={threadAnalysis.overview.highest_burn_score.toFixed(1)}
            />
            <RadarMetric
              label="Top topic"
              value={threadAnalysis.overview.latest_topic_label || "None"}
            />
          </div>
        </div>
        <div
          className={cn(sectionPanel, "grid content-start gap-3 p-5.5 max-sm:p-3.5")}
        >
          <h3 className="text-[1rem] font-black">What to do next</h3>
          <ol className="grid list-none gap-2 p-0">
            {visibleTopics.slice(0, 3).flatMap((topic) =>
              topic.next_actions.slice(0, 1).map((action) => (
                <li
                  className="border-kiri-line text-kiri-muted rounded-lg border bg-white/70 p-3 text-sm leading-relaxed font-bold"
                  key={`${topic.id}-${action}`}
                >
                  {action}
                </li>
              )),
            )}
          </ol>
        </div>
      </div>

      <div className="grid gap-3.5">
        {visibleTopics.length > 0 ? (
          visibleTopics.map((topic, index) => (
            <ThreadTopicCard
              index={index}
              key={topic.id}
              postsByNumber={postsByNumber}
              signalsByPost={signalsByPost}
              sourceUrl={sourceUrl}
              topic={topic}
            />
          ))
        ) : (
          <p className="border-kiri-line text-kiri-muted rounded-lg border border-dashed bg-white/70 p-4 font-bold">
            No recurring source-linked topics were detected yet.
          </p>
        )}
      </div>
    </section>
  );
}

function EvidenceMapSection({
  analysis,
  firstPost,
  meta,
  pepMetadata,
  postsByNumber,
  sourceUrl,
  signalsByPost,
}: {
  analysis: ConversationAnalysis;
  firstPost?: TopicPost;
  meta: TopicMeta;
  pepMetadata?: PepMetadata | null;
  postsByNumber: Map<number, TopicPost>;
  sourceUrl: string;
  signalsByPost: Map<number, Signal[]>;
}) {
  const roleEvents = analysis.positionEvents.filter((event) => event.roles.length > 0);
  const focusTopics = analysis.issues.slice(0, 8).map((issue) => issue.label);

  return (
    <section className="grid gap-5 pb-12">
      <div className={cn(sectionPanel, "grid gap-4 p-5.5 max-sm:p-3.5")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl leading-tight font-black tracking-normal">
              {pepMetadata
                ? `PEP ${pepMetadata.number}: ${pepMetadata.title}`
                : meta.title}
            </h2>
            <p className="text-kiri-muted mt-2 max-w-[900px] leading-relaxed">
              Issue status is inferred from source-linked signals. It is a review aid,
              not an official consensus decision.
            </p>
          </div>
          {pepMetadata ? (
            <a
              className="text-kiri-ink rounded-lg border border-[#f5c06f] bg-[#f5c06f] px-3 py-2 text-sm font-black no-underline"
              href={pepMetadata.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              PEP {pepMetadata.number}
            </a>
          ) : null}
        </div>
        <div className="grid grid-cols-5 gap-2 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <EvidenceMetric label="Issues" value={analysis.issues.length} />
          <EvidenceMetric
            label="Contested"
            value={
              analysis.issues.filter((issue) => issue.status === "in_contention").length
            }
          />
          <EvidenceMetric
            label="Resolved"
            value={
              analysis.issues.filter((issue) => issue.status === "resolved").length
            }
          />
          <EvidenceMetric label="Role events" value={roleEvents.length} />
          <EvidenceMetric
            label="Position shifts"
            value={analysis.signals.concession.length}
          />
        </div>
        <div className="border-kiri-line rounded-lg border bg-white/70 p-4">
          <h3 className="text-kiri-hero text-[0.95rem] font-black">
            What this thread is about
          </h3>
          <p className="text-kiri-muted mt-2 max-w-[980px] leading-relaxed">
            {threadFocusSummary(firstPost, meta.title)}
          </p>
          {focusTopics.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {focusTopics.map((topic) => (
                <span className={pill} key={topic}>
                  {topic}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <AgreementLegend />
      </div>

      <AgreementDisagreementFinder
        analysis={analysis}
        postsByNumber={postsByNumber}
        sourceUrl={sourceUrl}
        signalsByPost={signalsByPost}
      />

      <div className="grid items-start gap-3.5 lg:grid-cols-2">
        {analysis.issues.map((issue) => (
          <IssueCard
            issue={issue}
            key={issue.id}
            postsByNumber={postsByNumber}
            sourceUrl={sourceUrl}
            signalsByPost={signalsByPost}
          />
        ))}
      </div>

      <GuidedSection
        id="position-timeline"
        title="Position changes over time"
        intro="Role-bearing participants are pinned into the timeline when they revise, concede, ask, support, or contest an issue."
      >
        <div className="mt-6 grid gap-2">
          {(roleEvents.length > 0 ? roleEvents : analysis.positionEvents.slice(0, 12))
            .slice(0, 16)
            .map((event) => {
              const post = postsByNumber.get(event.postNumber);
              const eventSignal = signalsByPost
                .get(event.postNumber)
                ?.find(
                  (signal) =>
                    signal.category === event.category &&
                    signal.evidence === event.evidence,
                );
              if (!post) {
                return null;
              }
              return (
                <div
                  className="border-kiri-line grid gap-2 rounded-lg border bg-white/75 p-3.5"
                  key={`${event.category}-${event.postNumber}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-kiri-accent">@{event.username}</strong>
                    <span className={pill}>#{event.postNumber}</span>
                    <span
                      className={cn(
                        "max-w-full min-w-0 rounded-full border px-3 py-1.5 text-[0.83rem] leading-tight font-black [overflow-wrap:anywhere]",
                        signalCountBadgeTone(event.category),
                      )}
                    >
                      {categoryLabels[event.category]}
                    </span>
                    <RoleBadges roles={event.roles} />
                  </div>
                  <EvidenceText value={event.evidence} />
                  <EvidenceDrawer
                    label={`Open #${event.postNumber}`}
                    post={post}
                    signal={eventSignal}
                    sourceUrl={sourceUrl}
                    signals={signalsByPost.get(event.postNumber)}
                  />
                </div>
              );
            })}
        </div>
      </GuidedSection>
    </section>
  );
}

function EvidenceMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-kiri-line rounded-lg border bg-white/70 p-3">
      <p className="text-kiri-muted text-[0.72rem] font-black uppercase">{label}</p>
      <p className="text-kiri-hero mt-1 text-2xl font-black">
        {numberFormatter.format(value)}
      </p>
    </div>
  );
}

function RadarMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-kiri-line rounded-lg border bg-white/70 p-3">
      <p className="text-kiri-muted text-[0.72rem] font-black uppercase">{label}</p>
      <p className="text-kiri-hero mt-1 min-w-0 text-xl font-black [overflow-wrap:anywhere]">
        {typeof value === "number" ? numberFormatter.format(value) : value}
      </p>
    </div>
  );
}

function ThreadTopicCard({
  topic,
  index,
  postsByNumber,
  sourceUrl,
  signalsByPost,
}: {
  topic: ThreadTopic;
  index: number;
  postsByNumber: Map<number, TopicPost>;
  sourceUrl: string;
  signalsByPost: Map<number, Signal[]>;
}) {
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const discussionPosts = useMemo(
    () =>
      topic.post_numbers
        .map((postNumber) => postsByNumber.get(postNumber))
        .filter((post): post is TopicPost => Boolean(post)),
    [postsByNumber, topic.post_numbers],
  );
  const disapproving = topic.participant_stances.filter((stance) =>
    stance.stance.includes("disapproving"),
  );
  const approving = topic.participant_stances.filter((stance) =>
    stance.stance.includes("approving"),
  );
  const mixed = topic.participant_stances.filter((stance) => stance.stance === "mixed");

  return (
    <article
      className={cn(
        sectionPanel,
        "grid gap-4 p-5.5 max-sm:p-3.5",
        topic.burn.label === "burning" &&
          "border-[#c7352b]/45 bg-[linear-gradient(180deg,#fff3f1,#fbfdfb_48%)]",
      )}
    >
      <header className="grid gap-3 lg:grid-cols-[minmax(0,0.72fr)_minmax(280px,0.28fr)]">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="bg-kiri-hero text-kiri-surface rounded-full px-2.5 py-1 text-[0.72rem] font-black">
              #{index + 1}
            </span>
            {discussionPosts.length > 0 ? (
              <button
                className="border-kiri-accent bg-kiri-accent focus-visible:ring-kiri-accent mx-3 max-w-full min-w-0 cursor-pointer rounded-full border px-4.5 py-1.5 text-[0.83rem] leading-tight font-black [overflow-wrap:anywhere] text-[#fbfffc] shadow-[0_8px_18px_rgba(8,112,166,0.24)] hover:bg-[#075f8d] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                onClick={() => setIsDiscussionOpen(true)}
                type="button"
              >
                Open Discussion
              </button>
            ) : null}
            <span className="text-kiri-muted text-[0.86rem] leading-tight font-extrabold">
              Last discussed {formatRelativeTime(topic.last_activity_at)}
            </span>
          </div>
          <h3 className="text-[1.28rem] leading-tight font-black [overflow-wrap:anywhere]">
            {topic.label}
          </h3>
          {topic.description ? (
            <p className="text-kiri-hero mt-2 max-w-3xl text-sm leading-relaxed font-bold">
              {topic.description}
            </p>
          ) : null}
          <p className="text-kiri-muted mt-2 leading-relaxed">
            {topic.post_count} posts, {topic.participant_count} participants,{" "}
            {Math.round(topic.thread_share * 100)}% of thread.
          </p>
        </div>
        <BurnGauge topic={topic} />
      </header>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.72fr)_minmax(280px,0.28fr)]">
        <div className="grid gap-3">
          <ConvergenceDivergence topic={topic} />
          <div className="grid gap-2">
            <p className="text-kiri-muted text-[0.78rem] font-black uppercase">
              Newest source evidence
            </p>
            <div className="flex flex-wrap gap-2">
              {topic.evidence.map((evidence) => {
                const post = postsByNumber.get(evidence.post_number);
                return post ? (
                  <EvidenceDrawer
                    key={`${topic.id}-${evidence.post_number}`}
                    label={`#${evidence.post_number} · @${evidence.username}`}
                    post={post}
                    sourceUrl={sourceUrl}
                    signals={signalsByPost.get(evidence.post_number)}
                  />
                ) : null;
              })}
            </div>
          </div>
        </div>

        <aside className="grid content-start gap-3">
          <StanceGroup
            label="Diverging"
            postsByNumber={postsByNumber}
            signalsByPost={signalsByPost}
            sourceUrl={sourceUrl}
            stances={disapproving}
            tone="contest"
          />
          <StanceGroup
            label="Converging"
            postsByNumber={postsByNumber}
            signalsByPost={signalsByPost}
            sourceUrl={sourceUrl}
            stances={approving}
            tone="progress"
          />
          <StanceGroup
            label="Mixed"
            postsByNumber={postsByNumber}
            signalsByPost={signalsByPost}
            sourceUrl={sourceUrl}
            stances={mixed}
            tone="neutral"
          />
        </aside>
      </div>

      <div className="border-kiri-line rounded-lg border bg-white/70 p-3.5">
        <p className="text-kiri-muted text-[0.78rem] font-black uppercase">
          Suggested next move
        </p>
        <ul className="text-kiri-muted mt-2 grid gap-1.5 pl-4.5 text-sm leading-relaxed font-bold">
          {topic.next_actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </div>
      {isDiscussionOpen ? (
        <TopicDiscussionModal
          onClose={() => setIsDiscussionOpen(false)}
          posts={discussionPosts}
          signalsByPost={signalsByPost}
          sourceUrl={sourceUrl}
          topic={topic}
        />
      ) : null}
    </article>
  );
}

function TopicDiscussionModal({
  onClose,
  posts,
  signalsByPost,
  sourceUrl,
  topic,
}: {
  onClose: () => void;
  posts: TopicPost[];
  signalsByPost: Map<number, Signal[]>;
  sourceUrl: string;
  topic: ThreadTopic;
}) {
  const titleId = `topic-discussion-${topic.id}`;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  function scrollDiscussionToBottom() {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }
    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="bg-kiri-hero/70 fixed inset-0 z-50 grid min-w-0 p-[clamp(12px,3vw,36px)] backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <section
        className="border-kiri-line shadow-kiri-subtle grid max-h-[calc(100vh-24px)] min-h-0 w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)] self-center justify-self-center overflow-hidden rounded-lg border bg-[linear-gradient(180deg,#fbfdfb,#edf5f0)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-kiri-line bg-kiri-surface grid gap-3 border-b px-5.5 py-4 max-sm:px-3.5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-kiri-muted text-[0.74rem] font-black uppercase">
                Topic discussion
              </p>
              <h2
                className="text-kiri-hero mt-1 text-xl leading-tight font-black [overflow-wrap:anywhere]"
                id={titleId}
              >
                {topic.label}
              </h2>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button
                className="border-kiri-accent/30 bg-kiri-accent-soft text-kiri-accent grid h-9 cursor-pointer place-items-center rounded-lg border px-3 text-sm font-black hover:bg-[#cfe9f4]"
                onClick={scrollDiscussionToBottom}
                type="button"
              >
                Scroll to bottom
              </button>
              <button
                aria-label="Close discussion"
                className="grid h-9 min-w-9 cursor-pointer place-items-center rounded-lg border border-[#c7352b]/45 bg-[#ffe0dc] px-3 text-sm font-black text-[#9f241c] hover:bg-[#ffd0ca] focus-visible:ring-2 focus-visible:ring-[#c7352b] focus-visible:ring-offset-2 focus-visible:outline-none"
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
          {topic.description ? (
            <p className="text-kiri-muted max-w-3xl text-sm leading-relaxed font-bold">
              {topic.description}
            </p>
          ) : null}
        </header>
        <div
          className="min-h-0 overflow-y-auto overscroll-contain p-4 max-sm:p-2.5"
          ref={scrollContainerRef}
        >
          <SourcePostList
            emptyMessage="No source posts were attached to this topic."
            idPrefix={`topic-${topic.id}-post`}
            posts={posts}
            sourceUrl={sourceUrl}
            signalsByPost={signalsByPost}
          />
        </div>
      </section>
    </div>
  );
}

function BurnGauge({ topic }: { topic: ThreadTopic }) {
  return (
    <div className="border-kiri-line grid content-start gap-2 rounded-lg border bg-white/75 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[1.55rem]" aria-hidden="true">
          {topic.burn.emoji}
        </span>
        <strong
          className={cn(
            "rounded-full px-2.5 py-1 text-[0.74rem] font-black uppercase",
            burnTone(topic.burn.label),
          )}
        >
          {topic.burn.label}
        </strong>
      </div>
      <div
        aria-label={`Disagreement score ${topic.disagreement_score.toFixed(1)} of 10`}
        className="bg-kiri-line h-3 overflow-hidden rounded-full"
      >
        <div
          className={cn("h-full rounded-full", burnBarTone(topic.burn.label))}
          style={{ width: `${Math.min(100, Math.max(0, topic.burn.percent))}%` }}
        />
      </div>
      <p className="text-kiri-hero text-2xl font-black">
        {topic.disagreement_score.toFixed(1)}
        <span className="text-kiri-muted text-sm"> / 10</span>
      </p>
      <p className="text-kiri-muted text-sm leading-relaxed font-bold">
        {topic.burn.note}
      </p>
    </div>
  );
}

function ConvergenceDivergence({ topic }: { topic: ThreadTopic }) {
  const convergencePercent = Math.min(100, Math.max(0, topic.convergence.score * 10));
  const divergencePercent = Math.min(100, Math.max(0, topic.divergence.score * 10));

  return (
    <div className="grid gap-2">
      <AxisBar
        label={`Convergence: ${topic.convergence.label}`}
        percent={convergencePercent}
        tone="progress"
      />
      <AxisBar
        label={`Divergence: ${topic.divergence.label}`}
        percent={divergencePercent}
        tone="contest"
      />
    </div>
  );
}

function AxisBar({
  label,
  percent,
  tone,
}: {
  label: string;
  percent: number;
  tone: "progress" | "contest";
}) {
  return (
    <div className="border-kiri-line rounded-lg border bg-white/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-black">{label}</span>
        <span className="text-kiri-muted text-xs font-black">
          {Math.round(percent)}%
        </span>
      </div>
      <div className="bg-kiri-line h-2.5 overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "progress" ? "bg-[#07804f]" : "bg-[#c7352b]",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StanceGroup({
  label,
  postsByNumber,
  sourceUrl,
  signalsByPost,
  stances,
  tone,
}: {
  label: string;
  postsByNumber: Map<number, TopicPost>;
  sourceUrl: string;
  signalsByPost: Map<number, Signal[]>;
  stances: ThreadParticipantStance[];
  tone: "contest" | "progress" | "neutral";
}) {
  if (stances.length === 0) {
    return null;
  }

  return (
    <div className="border-kiri-line rounded-lg border bg-white/70 p-3">
      <p className="text-kiri-muted text-[0.76rem] font-black uppercase">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {stances.slice(0, 6).map((stance) => {
          const post = postsByNumber.get(stance.latest_post_number);
          return post ? (
            <EvidenceDrawer
              key={`${stance.username}-${stance.latest_post_number}`}
              label={`@${stance.username} · #${stance.latest_post_number}`}
              post={post}
              sourceUrl={sourceUrl}
              signals={signalsByPost.get(stance.latest_post_number)}
            />
          ) : (
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[0.76rem] font-black",
                stanceTone(tone),
              )}
              key={`${stance.username}-${stance.latest_post_number}`}
              title={`${stanceLabel(stance.stance)} at #${stance.latest_post_number}`}
            >
              @{stance.username} · #{stance.latest_post_number}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function AgreementLegend() {
  return (
    <div className="border-kiri-line grid gap-2 rounded-lg border bg-white/70 p-4">
      <h3 className="text-kiri-hero text-[0.95rem] font-black">Signal color key</h3>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex min-h-9 items-center rounded-full border border-[#07804f]/35 bg-[#dff7e8] px-3 text-[0.84rem] font-black text-[#05683f]">
          Agreement: support, acceptance, shared ground
        </span>
        <span className="inline-flex min-h-9 items-center rounded-full border border-[#c7352b]/35 bg-[#ffe0dc] px-3 text-[0.84rem] font-black text-[#9f241c]">
          Disagreement: objections, risk, pushback
        </span>
      </div>
    </div>
  );
}

function AgreementDisagreementFinder({
  analysis,
  postsByNumber,
  sourceUrl,
  signalsByPost,
}: {
  analysis: ConversationAnalysis;
  postsByNumber: Map<number, TopicPost>;
  sourceUrl: string;
  signalsByPost: Map<number, Signal[]>;
}) {
  return (
    <section className="grid items-start gap-3.5 lg:grid-cols-2">
      <EvidenceFinderColumn
        category="agreement"
        postsByNumber={postsByNumber}
        signals={analysis.signals.agreement.slice(0, 5)}
        signalsByPost={signalsByPost}
        sourceUrl={sourceUrl}
      />
      <EvidenceFinderColumn
        category="disagreement"
        postsByNumber={postsByNumber}
        signals={analysis.signals.disagreement.slice(0, 5)}
        signalsByPost={signalsByPost}
        sourceUrl={sourceUrl}
      />
    </section>
  );
}

function EvidenceFinderColumn({
  category,
  postsByNumber,
  signals,
  signalsByPost,
  sourceUrl,
}: {
  category: "agreement" | "disagreement";
  postsByNumber: Map<number, TopicPost>;
  signals: Signal[];
  signalsByPost: Map<number, Signal[]>;
  sourceUrl: string;
}) {
  const isAgreement = category === "agreement";

  return (
    <section
      className={cn(
        "shadow-kiri-subtle grid gap-3 rounded-lg border p-4",
        isAgreement
          ? "border-[#07804f]/35 bg-[#f1fbf5]"
          : "border-[#c7352b]/35 bg-[#fff3f1]",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3
          className={cn(
            "text-[1.05rem] font-black",
            isAgreement ? "text-[#05683f]" : "text-[#9f241c]",
          )}
        >
          {isAgreement ? "Find agreement" : "Find disagreement"}
        </h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[0.72rem] font-black",
            isAgreement ? "bg-[#07804f] text-white" : "bg-[#c7352b] text-white",
          )}
        >
          {signals.length} shown
        </span>
      </header>
      {signals.length > 0 ? (
        <ol className="grid list-none gap-2 p-0">
          {signals.map((signal) => {
            const post = postsByNumber.get(signal.postNumber);
            if (!post) {
              return null;
            }

            return (
              <li
                className={cn(
                  "grid gap-2 rounded-lg border bg-white/80 p-3",
                  isAgreement ? "border-[#07804f]/25" : "border-[#c7352b]/25",
                )}
                key={`${category}-${signal.postNumber}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[0.72rem] font-black text-white",
                      isAgreement ? "bg-[#07804f]" : "bg-[#c7352b]",
                    )}
                  >
                    #{signal.postNumber}
                  </span>
                  <strong className="text-sm font-black">@{signal.username}</strong>
                </div>
                <EvidenceText value={signal.evidence} />
                <EvidenceDrawer
                  label={`Open #${signal.postNumber}`}
                  post={post}
                  signal={signal}
                  signals={signalsByPost.get(signal.postNumber)}
                  sourceUrl={sourceUrl}
                />
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="border-kiri-line text-kiri-muted rounded-lg border border-dashed bg-white/70 p-3 text-sm font-bold">
          No clear {isAgreement ? "agreement" : "disagreement"} evidence found.
        </p>
      )}
    </section>
  );
}

function IssueCard({
  issue,
  postsByNumber,
  sourceUrl,
  signalsByPost,
}: {
  issue: DiscussionIssue;
  postsByNumber: Map<number, TopicPost>;
  sourceUrl: string;
  signalsByPost: Map<number, Signal[]>;
}) {
  const [activeSignalFilter, setActiveSignalFilter] = useState<SignalCategory | null>(
    null,
  );
  const issuePosts = issue.postNumbers
    .map((postNumber) => postsByNumber.get(postNumber))
    .filter((post): post is TopicPost => Boolean(post));
  const filteredPosts = activeSignalFilter
    ? issuePosts.filter((post) =>
        signalsByPost
          .get(post.post_number)
          ?.some((signal) => signal.category === activeSignalFilter),
      )
    : issuePosts;
  const postFilterLabel = activeSignalFilter
    ? categoryLabels[activeSignalFilter]
    : "All evidence";
  const postCountLabel = `${filteredPosts.length} of ${issuePosts.length}`;
  const postNumberList = issue.postNumbers
    .map((postNumber) => `#${postNumber}`)
    .join(", ");
  const reviewPostLabel = activeSignalFilter
    ? `Review source posts: ${postFilterLabel}`
    : "Review source posts";

  function toggleSignalFilter(category: SignalCategory) {
    setActiveSignalFilter((currentCategory) =>
      currentCategory === category ? null : category,
    );
  }

  function resetSignalFilter() {
    setActiveSignalFilter(null);
  }

  const reviewDrawerLabel = (post: TopicPost) =>
    activeSignalFilter
      ? `${postContextLabels[activeSignalFilter]} #${post.post_number}`
      : `Review #${post.post_number}`;
  const selectedSignalForPost = (post: TopicPost) =>
    activeSignalFilter
      ? signalsByPost
          .get(post.post_number)
          ?.find((signal) => signal.category === activeSignalFilter)
      : undefined;

  return (
    <article
      className={cn(
        sectionPanel,
        "grid max-w-full gap-4 self-start p-5.5 max-sm:p-3.5",
      )}
    >
      <header className="grid min-w-0 gap-3">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 basis-[220px]">
            <h3 className="text-[1.08rem] leading-tight font-black [overflow-wrap:anywhere]">
              {issue.label}
            </h3>
            {issue.description ? (
              <p className="text-kiri-hero mt-1 text-sm leading-relaxed font-bold">
                {issue.description}
              </p>
            ) : null}
            <p className="text-kiri-muted mt-1 text-sm font-bold">
              {issue.postNumbers.length} source posts
            </p>
          </div>
          <span
            className={cn(
              "max-w-full shrink-0 rounded-full px-3 py-1.5 text-center text-[0.75rem] leading-tight font-black [overflow-wrap:anywhere]",
              statusTone(issue.status),
            )}
          >
            {statusLabel(issue.status)}
          </span>
        </div>
        <p className="text-kiri-muted max-w-full text-sm leading-relaxed font-bold [overflow-wrap:anywhere]">
          Posts {postNumberList}
        </p>
      </header>
      <SignalStack
        activeCategory={activeSignalFilter}
        counts={issue.signalCounts}
        onFilter={toggleSignalFilter}
        onReset={resetSignalFilter}
      />
      <div className="flex flex-wrap gap-2">
        <RoleBadges roles={issue.roleActivity} />
      </div>
      {issuePosts.length > 0 ? (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-kiri-muted text-[0.78rem] font-black uppercase">
              {reviewPostLabel}
            </p>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[0.76rem] font-black",
                activeSignalFilter
                  ? signalCountBadgeTone(activeSignalFilter)
                  : "border-kiri-line bg-kiri-surface text-kiri-muted",
              )}
            >
              {postCountLabel}
            </span>
          </div>
          {filteredPosts.length > 0 ? (
            <div className="flex flex-wrap items-start gap-2">
              {filteredPosts.map((post) => (
                <EvidenceDrawer
                  key={post.id}
                  label={reviewDrawerLabel(post)}
                  post={post}
                  signal={selectedSignalForPost(post)}
                  sourceUrl={sourceUrl}
                  signals={signalsByPost.get(post.post_number)}
                />
              ))}
            </div>
          ) : (
            <p className="border-kiri-line text-kiri-muted rounded-lg border border-dashed bg-white/70 p-3 text-sm font-bold">
              No source posts in this issue match {postFilterLabel}.
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}

function SignalStack({
  activeCategory,
  counts,
  onFilter,
  onReset,
}: {
  activeCategory: SignalCategory | null;
  counts: Record<SignalCategory, number>;
  onFilter: (category: SignalCategory) => void;
  onReset: () => void;
}) {
  const total = Math.max(
    1,
    Object.values(counts).reduce((sum, value) => sum + value, 0),
  );
  const visibleCategories = (Object.keys(counts) as SignalCategory[]).filter(
    (category) => counts[category] > 0,
  );

  return (
    <div className="grid gap-2" aria-label="Filter source posts by evidence type">
      <div className="bg-kiri-line flex h-3 overflow-hidden rounded-full">
        {visibleCategories.map((category) => (
          <button
            aria-label={`Show ${categoryLabels[category]} posts`}
            aria-pressed={activeCategory === category}
            className={cn(
              signalBarTone(category),
              "h-full cursor-pointer border-0 p-0 transition-opacity hover:opacity-80",
              activeCategory && activeCategory !== category
                ? "opacity-35"
                : "opacity-100",
            )}
            key={category}
            onClick={() => onFilter(category)}
            style={{ width: `${(counts[category] / total) * 100}%` }}
            title={`${categoryLabels[category]}: ${counts[category]}`}
            type="button"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visibleCategories.map((category) => (
          <button
            aria-pressed={activeCategory === category}
            className={cn(
              "max-w-full min-w-0 cursor-pointer rounded-full border px-3 py-1.5 text-left text-[0.83rem] leading-tight font-black [overflow-wrap:anywhere] no-underline",
              signalCountBadgeTone(category),
              activeCategory === category
                ? "shadow-[0_0_0_2px_rgba(22,50,43,0.18)]"
                : "hover:brightness-[0.98]",
              activeCategory && activeCategory !== category
                ? "opacity-55"
                : "opacity-100",
            )}
            key={category}
            onClick={() => onFilter(category)}
            type="button"
          >
            {counts[category]} {categoryLabels[category]}
          </button>
        ))}
        {activeCategory ? (
          <button
            className="border-kiri-line bg-kiri-surface text-kiri-muted hover:bg-kiri-soft max-w-full min-w-0 cursor-pointer rounded-full border px-3 py-1.5 text-[0.83rem] leading-tight font-black [overflow-wrap:anywhere]"
            onClick={onReset}
            type="button"
          >
            Reset filters
          </button>
        ) : null}
      </div>
    </div>
  );
}

function RoleBadges({ roles }: { roles?: PepRoleTag[] }) {
  if (!roles || roles.length === 0) {
    return null;
  }
  return (
    <>
      {roles.map((role) => (
        <span
          className="text-kiri-ink rounded-full border border-[#f5c06f] bg-[#fff3cd] px-2.5 py-1 text-[0.72rem] font-black"
          key={`${role.role}-${role.pep_name}`}
        >
          {roleLabel(role.role)}
          {!role.confirmed ? " ?" : ""}
        </span>
      ))}
    </>
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
          <span
            className={cn(
              "max-w-full min-w-0 rounded-full border px-3 py-1.5 text-[0.83rem] leading-tight font-black [overflow-wrap:anywhere]",
              signalCountBadgeTone("agreement"),
            )}
          >
            {phase.signalCounts.agreement} convergence
          </span>
          <span
            className={cn(
              "max-w-full min-w-0 rounded-full border px-3 py-1.5 text-[0.83rem] leading-tight font-black [overflow-wrap:anywhere]",
              signalCountBadgeTone("disagreement"),
            )}
          >
            {phase.signalCounts.disagreement} contested
          </span>
          <span
            className={cn(
              "max-w-full min-w-0 rounded-full border px-3 py-1.5 text-[0.83rem] leading-tight font-black [overflow-wrap:anywhere]",
              signalCountBadgeTone("question"),
            )}
          >
            {phase.signalCounts.question} questions
          </span>
          <span
            className={cn(
              "max-w-full min-w-0 rounded-full border px-3 py-1.5 text-[0.83rem] leading-tight font-black [overflow-wrap:anywhere]",
              signalCountBadgeTone("progress"),
            )}
          >
            {phase.signalCounts.progress} progress
          </span>
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
        <span
          className={cn(
            "min-w-0 rounded-full border px-2.5 py-1 text-[0.82rem] font-black [overflow-wrap:anywhere]",
            signalCountBadgeTone(category),
          )}
        >
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
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-kiri-accent font-black [overflow-wrap:anywhere]">
            @{author.username}
          </span>
          <RoleBadges roles={author.roles} />
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
          {posts.map((post) => (
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

function SourcePostList({
  className,
  emptyMessage = "No source posts are available.",
  id,
  idPrefix = "post",
  posts,
  sourceListRef,
  sourceUrl,
  signalsByPost,
}: {
  className?: string;
  emptyMessage?: string;
  id?: string;
  idPrefix?: string;
  posts: TopicPost[];
  sourceListRef?: RefObject<HTMLDivElement | null>;
  sourceUrl: string;
  signalsByPost: Map<number, Signal[]>;
}) {
  return (
    <div
      className={cn(
        "grid max-w-full min-w-0 gap-3.5 pr-1.5 [overflow-anchor:none]",
        className,
      )}
      id={id}
      ref={sourceListRef}
    >
      {posts.length > 0 ? (
        posts.map((post) => (
          <SourceMessage
            expanded
            idPrefix={idPrefix}
            key={post.id}
            post={post}
            sourceUrl={sourceUrl}
            signals={signalsByPost.get(post.post_number)}
          />
        ))
      ) : (
        <p className="border-kiri-line text-kiri-muted rounded-lg border border-dashed bg-white/70 p-4 font-bold">
          {emptyMessage}
        </p>
      )}
    </div>
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
  idPrefix = "post",
  post,
  sourceUrl,
  signals,
  expanded = false,
}: {
  idPrefix?: string;
  post: TopicPost;
  sourceUrl: string;
  signals?: Signal[];
  expanded?: boolean;
}) {
  return (
    <details
      className={cn(sectionPanel, "[&>summary::-webkit-details-marker]:hidden")}
      data-source-post={post.post_number}
      id={`${idPrefix}-${post.post_number}`}
      open={expanded}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3.5 p-5.5 max-sm:flex-col">
        <span className="text-kiri-accent min-w-0 font-black [overflow-wrap:anywhere]">
          #{post.post_number}
        </span>
        <strong className="min-w-0 font-extrabold [overflow-wrap:anywhere]">
          @{post.username}
        </strong>
        <RoleBadges roles={post.author_roles} />
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
  const primaryCategory = signal?.category ?? postSignals[0]?.category;

  return (
    <article
      className={cn(
        sourcePreviewBase,
        primaryCategory && sourcePreviewByCategory[primaryCategory],
      )}
    >
      <header className="flex items-start justify-between gap-3.5 max-sm:flex-col">
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-kiri-ink font-extrabold">
              #{post.post_number} by @{post.username}
            </p>
            <RoleBadges roles={post.author_roles} />
          </div>
          {post.author_name ? (
            <p className="text-kiri-muted mt-1 text-[0.86rem] font-bold">
              {post.author_name}
            </p>
          ) : null}
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
          rel="noopener noreferrer"
          target="_blank"
        >
          Open Source
        </a>
      </header>

      {signal ? (
        <p
          className={cn(
            "w-fit max-w-full rounded-full border px-3 py-1.5 text-[0.83rem] font-bold [overflow-wrap:anywhere]",
            signalCountBadgeTone(signal.category),
          )}
        >
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
        className="discoursePost border-kiri-line bg-kiri-surface max-w-full min-w-0 rounded-lg border p-5.5 text-[0.98rem] leading-relaxed text-[#303733] max-sm:p-3.5"
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
  if (category === "progress") {
    return 3;
  }
  if (category === "concession") {
    return 4;
  }
  if (category === "revision") {
    return 5;
  }
  return 6;
}

function roleLabel(role: string): string {
  if (role === "author") {
    return "PEP author";
  }
  if (role === "sponsor") {
    return "Sponsor";
  }
  if (role === "delegate") {
    return "Delegate";
  }
  return role;
}

function roleSummary(matches: RoleMatch[]): string {
  const confirmed = matches.filter((match) => match.confirmed && match.username);
  const authors = confirmed.filter((match) => match.role === "author").length;
  const sponsors = confirmed.filter((match) => match.role === "sponsor").length;
  const delegates = confirmed.filter((match) => match.role === "delegate").length;
  const summary = [
    authors > 0 ? `${authors} PEP ${authors === 1 ? "author" : "authors"}` : "",
    sponsors > 0 ? `${sponsors} ${sponsors === 1 ? "sponsor" : "sponsors"}` : "",
    delegates > 0 ? `${delegates} ${delegates === 1 ? "delegate" : "delegates"}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return summary || `${matches.length} PEP people`;
}

function unmatchedRoleCount(matches: RoleMatch[]): number {
  return matches.filter((match) => !match.confirmed || !match.username).length;
}

function threadFocusSummary(firstPost: TopicPost | undefined, title: string): string {
  if (!firstPost) {
    return title;
  }
  const text = postText(firstPost);
  const firstMeaningfulSentence =
    text
      .match(/[^.!?]+(?:[.!?]+|$)/g)
      ?.map((sentence) => sentence.trim())
      .find((sentence) => sentence.split(/\s+/).filter(Boolean).length >= 8) ?? "";
  return firstMeaningfulSentence || title;
}

function burnTone(label: ThreadTopic["burn"]["label"]): string {
  if (label === "burning") {
    return "bg-[#c7352b] text-white";
  }
  if (label === "hot") {
    return "bg-kiri-contest-soft text-kiri-contest";
  }
  if (label === "warm") {
    return "bg-kiri-note-soft text-kiri-note";
  }
  return "bg-[#dff7e8] text-[#05683f]";
}

function burnBarTone(label: ThreadTopic["burn"]["label"]): string {
  if (label === "burning") {
    return "bg-[#c7352b]";
  }
  if (label === "hot") {
    return "bg-kiri-contest";
  }
  if (label === "warm") {
    return "bg-kiri-note";
  }
  return "bg-[#07804f]";
}

function stanceTone(tone: "contest" | "progress" | "neutral"): string {
  if (tone === "contest") {
    return "border-[#c7352b]/35 bg-[#ffe0dc] text-[#9f241c]";
  }
  if (tone === "progress") {
    return "border-[#07804f]/35 bg-[#dff7e8] text-[#05683f]";
  }
  return "border-kiri-line bg-kiri-soft text-kiri-muted";
}

function stanceLabel(stance: ThreadParticipantStance["stance"]): string {
  return stance.replace(/_/g, " ");
}

function statusLabel(status: DiscussionIssue["status"]): string {
  return status.replace(/_/g, " ");
}

function statusTone(status: DiscussionIssue["status"]): string {
  if (status === "resolved") {
    return "bg-[#dff3ff] text-[#075f8d]";
  }
  if (status === "work_in_progress") {
    return "bg-[#e4f7ee] text-[#137244]";
  }
  if (status === "in_contention") {
    return "bg-kiri-contest-soft text-kiri-contest";
  }
  if (status === "in_discussion") {
    return "bg-kiri-note-soft text-kiri-note";
  }
  if (status === "stale") {
    return "bg-[#eef0f1] text-[#555f59]";
  }
  return "bg-kiri-soft text-kiri-muted";
}

function signalBarTone(category: SignalCategory): string {
  if (category === "agreement") {
    return "bg-[#07804f]";
  }
  if (category === "disagreement") {
    return "bg-[#c7352b]";
  }
  if (category === "question") {
    return "bg-kiri-note";
  }
  if (category === "progress") {
    return "bg-kiri-progress";
  }
  if (category === "concession") {
    return "bg-[#7a4cc2]";
  }
  if (category === "revision") {
    return "bg-[#16834d]";
  }
  return "bg-[#0b6f9d]";
}

function signalCountBadgeTone(category: SignalCategory): string {
  if (category === "agreement") {
    return "border-[#07804f]/35 bg-[#dff7e8] text-[#05683f]";
  }
  if (category === "disagreement") {
    return "border-[#c7352b]/35 bg-[#ffe0dc] text-[#9f241c]";
  }
  if (category === "question") {
    return "border-kiri-note/30 bg-kiri-note-soft text-kiri-note";
  }
  if (category === "progress") {
    return "border-kiri-progress/30 bg-kiri-progress-soft text-kiri-progress";
  }
  if (category === "concession") {
    return "border-[#7a4cc2]/30 bg-[#f6edff] text-[#6d3db5]";
  }
  if (category === "revision") {
    return "border-[#16834d]/30 bg-[#e4f7ee] text-[#137244]";
  }
  return "border-[#0b6f9d]/30 bg-[#dff3ff] text-[#075f8d]";
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

function formatRelativeTime(value: string): string {
  if (!value) {
    return "unknown";
  }

  const then = new Date(value).getTime();
  if (Number.isNaN(then)) {
    return "unknown";
  }

  const elapsedMs = Math.max(0, Date.now() - then);
  const units = [
    { label: "year", ms: 365 * 24 * 60 * 60 * 1000 },
    { label: "month", ms: 30 * 24 * 60 * 60 * 1000 },
    { label: "day", ms: 24 * 60 * 60 * 1000 },
    { label: "hour", ms: 60 * 60 * 1000 },
  ];

  for (const unit of units) {
    const count = Math.floor(elapsedMs / unit.ms);
    if (count >= 1) {
      return `${count} ${unit.label}${count === 1 ? "" : "s"} ago`;
    }
  }

  return "less than an hour ago";
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
