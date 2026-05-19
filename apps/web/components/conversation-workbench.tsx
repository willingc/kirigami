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

function sourcePostUrl(sourceUrl: string, postNumber: number): string {
  return `${sourceUrl.replace(/\/$/, "")}/${postNumber}`;
}

const workbenchTabs = [
  { id: "summary", label: "Summary" },
  { id: "path", label: "Read the thread in four passes" },
  { id: "positions", label: "Evidence for agreement and disagreement" },
  { id: "voices", label: "Who shaped the discussion" },
  { id: "source", label: "Sources" },
] as const;

type WorkbenchTab = (typeof workbenchTabs)[number]["id"];

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
  const analysis = useMemo(() => analyzeConversation(posts), [posts]);
  const postsByNumber = useMemo(
    () => new Map(posts.map((post) => [post.post_number, post])),
    [posts],
  );
  const firstPost = posts[0];
  const lastPost = posts.at(-1);

  useEffect(() => {
    if (activeTab !== "source" || posts.length === 0) {
      return;
    }

    const sourceList = sourceListRef.current;
    if (!sourceList) {
      return;
    }

    let frame: number | null = null;
    const updateFromScroll = () => {
      frame = null;
      const maxScroll = Math.max(1, sourceList.scrollHeight - sourceList.clientHeight);
      const ratio = Math.min(1, Math.max(0, sourceList.scrollTop / maxScroll));
      const post = posts[Math.round(ratio * (posts.length - 1))];
      if (post) {
        setActiveSourcePost(post.post_number);
      }
    };

    const handleScroll = () => {
      if (frame !== null) {
        return;
      }
      frame = requestAnimationFrame(updateFromScroll);
    };

    updateFromScroll();
    sourceList.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      sourceList.removeEventListener("scroll", handleScroll);
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [activeTab, posts]);

  return (
    <main className="readerShell">
      <article className="readerArticle">
        <header className="readerHero">
          <p className="eyebrow">Kirigami guided reading</p>
          <h1>{meta.title}</h1>
          <p className="heroDeck">
            A calmer path through Topic {meta.topicId}: start with the shape of the discussion,
            then open exact source posts only when you need evidence.
          </p>
          <div className="heroMeta" aria-label="Conversation metrics">
            <span>{numberFormatter.format(analysis.metrics.posts)} posts</span>
            <span>{numberFormatter.format(analysis.metrics.participants)} authors</span>
            <span>{analysis.metrics.estimatedReadMinutes} min source read</span>
            <span>
              {formatDate(analysis.metrics.firstPostAt)} to {formatDate(analysis.metrics.lastPostAt)}
            </span>
          </div>
          <div className="heroActions">
            <a href={meta.sourceUrl}>Open Discourse</a>
            <span>Heuristic evidence, not conclusions</span>
          </div>
        </header>

        <nav className="workbenchTabs" aria-label="Conversation views" role="tablist">
          {workbenchTabs.map((tab) => (
            <button
              aria-controls={`panel-${tab.id}`}
              aria-selected={activeTab === tab.id}
              id={`tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div
          aria-labelledby={`tab-${activeTab}`}
          className="tabPanel"
          id={`panel-${activeTab}`}
          role="tabpanel"
        >
          {activeTab === "summary" ? (
            <section className="briefPanel" id="brief">
              <BriefBlock
                title="What this discussion is about"
                body={
                  firstPost
                    ? `The opening post introduces ${meta.title} and sets up the discussion that follows.`
                    : "The source data did not include an opening post."
                }
                post={firstPost}
                sourceUrl={meta.sourceUrl}
              />
              <BriefBlock
                title="Where it seems to converge"
                body="The strongest convergence evidence is not treated as consensus. It is a shortlist of posts whose wording suggests agreement, support, or acceptance."
                signals={analysis.signals.agreement.slice(0, 3)}
                postsByNumber={postsByNumber}
                sourceUrl={meta.sourceUrl}
              />
              <BriefBlock
                title="What remains contested"
                body="The strongest contested evidence is a shortlist of posts that appear to carry concern, objection, risk, or pushback language."
                signals={analysis.signals.disagreement.slice(0, 3)}
                postsByNumber={postsByNumber}
                sourceUrl={meta.sourceUrl}
              />
            </section>
          ) : null}

          {activeTab === "path" ? (
            <GuidedSection
              eyebrow="Reading path"
              id="path"
              title="Read the thread in four passes"
              intro="Instead of starting with 225 posts, use the conversation phases as a map. Each phase opens at source level when you need to inspect the underlying messages."
            >
              <div className="pathList">
                {analysis.phases.map((phase) => (
                  <PhaseStep
                    key={phase.id}
                    phase={phase}
                    postsByNumber={postsByNumber}
                    sourceUrl={meta.sourceUrl}
                  />
                ))}
              </div>
            </GuidedSection>
          ) : null}

          {activeTab === "positions" ? (
            <GuidedSection
              eyebrow="Positions"
              id="positions"
              title="Evidence for agreement and disagreement"
              intro="These sections are intentionally restrained: they point to likely evidence, then let the source post carry the argument."
            >
              <div className="evidenceSections">
                <SignalSection
                  analysis={analysis}
                  category="agreement"
                  postsByNumber={postsByNumber}
                  sourceUrl={meta.sourceUrl}
                  limit={6}
                />
                <SignalSection
                  analysis={analysis}
                  category="disagreement"
                  postsByNumber={postsByNumber}
                  sourceUrl={meta.sourceUrl}
                  limit={6}
                />
                <SignalSection
                  analysis={analysis}
                  category="question"
                  postsByNumber={postsByNumber}
                  sourceUrl={meta.sourceUrl}
                  limit={5}
                />
                <SignalSection
                  analysis={analysis}
                  category="progress"
                  postsByNumber={postsByNumber}
                  sourceUrl={meta.sourceUrl}
                  limit={5}
                />
              </div>
            </GuidedSection>
          ) : null}

          {activeTab === "voices" ? (
            <GuidedSection
              eyebrow="Voices"
              id="voices"
              title="Who shaped the discussion"
              intro="Author rows stay compact until opened. Each expanded row shows the author's post cadence and the first few source messages."
            >
              <div className="voiceList">
                {analysis.authors.slice(0, 10).map((author) => (
                  <AuthorRow
                    author={author}
                    key={author.username}
                    posts={posts.filter((post) => post.username === author.username)}
                    sourceUrl={meta.sourceUrl}
                  />
                ))}
              </div>
            </GuidedSection>
          ) : null}

          {activeTab === "source" ? (
            <GuidedSection
              eyebrow="Source"
              id="source"
              title="Source messages remain available"
              intro="The full thread is preserved below with source messages expanded and a timeline for jumping through the discussion."
            >
              <div className="sourceWorkspace">
                <div className="sourceList" id="source-list" ref={sourceListRef}>
                  {posts.map((post) => (
                    <SourceMessage
                      expanded
                      key={post.id}
                      post={post}
                      sourceUrl={meta.sourceUrl}
                    />
                  ))}
                </div>
                <SourceTimeline
                  activePostNumber={activeSourcePost}
                  onActivePostChange={setActiveSourcePost}
                  posts={posts}
                  sourceListRef={sourceListRef}
                />
              </div>
              {lastPost ? (
                <footer className="readerFooter">
                  Last source post in this JSON: #{lastPost.post_number} by @{lastPost.username} on{" "}
                  {formatTime(lastPost.created_at)}.
                </footer>
              ) : null}
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
}: {
  title: string;
  body: string;
  post?: TopicPost;
  signals?: Signal[];
  postsByNumber?: Map<number, TopicPost>;
  sourceUrl: string;
}) {
  return (
    <section className="briefBlock">
      <h2>{title}</h2>
      {signals && postsByNumber ? (
        <ul className="briefSignalList">
          {signals.map((signal) => {
            const sourcePost = postsByNumber.get(signal.postNumber);
            return sourcePost ? (
              <li key={`${signal.category}-${signal.postNumber}`}>
                <p>
                  <strong>@{signal.username}</strong>
                  <span>{signal.evidence}</span>
                </p>
                <EvidenceDrawer
                  label={`#${signal.postNumber}`}
                  post={sourcePost}
                  sourceUrl={sourceUrl}
                  signal={signal}
                />
              </li>
            ) : null;
          })}
        </ul>
      ) : (
        <p>{body}</p>
      )}
      {post ? (
        <EvidenceDrawer label={`#${post.post_number}`} post={post} sourceUrl={sourceUrl} />
      ) : null}
    </section>
  );
}

function GuidedSection({
  eyebrow,
  id,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  id: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className="guidedSection" id={id}>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="sectionIntro">{intro}</p>
      {children}
    </section>
  );
}

function PhaseStep({
  phase,
  postsByNumber,
  sourceUrl,
}: {
  phase: Phase;
  postsByNumber: Map<number, TopicPost>;
  sourceUrl: string;
}) {
  const openingPost = postsByNumber.get(phase.postStart);
  const closingPost = postsByNumber.get(phase.postEnd);

  return (
    <section className="phaseStep">
      <div className="phaseNumber">{phase.postStart}</div>
      <div>
        <h3>{phase.label}</h3>
        <p>
          Posts #{phase.postStart}-#{phase.postEnd}, {phase.postCount} messages, led by{" "}
          {phase.dominantAuthors.map((author) => `@${author}`).join(", ")}.
        </p>
        <div className="signalCounts">
          <span>{phase.signalCounts.agreement} convergence</span>
          <span>{phase.signalCounts.disagreement} contested</span>
          <span>{phase.signalCounts.question} questions</span>
          <span>{phase.signalCounts.progress} progress</span>
        </div>
        <div className="citationRow">
          {openingPost ? (
            <EvidenceDrawer
              label={`Open #${phase.postStart}`}
              post={openingPost}
              sourceUrl={sourceUrl}
            />
          ) : null}
          {closingPost && closingPost.post_number !== openingPost?.post_number ? (
            <EvidenceDrawer
              label={`Close #${phase.postEnd}`}
              post={closingPost}
              sourceUrl={sourceUrl}
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
  limit,
}: {
  analysis: ConversationAnalysis;
  category: SignalCategory;
  postsByNumber: Map<number, TopicPost>;
  sourceUrl: string;
  limit: number;
}) {
  const signals = analysis.signals[category].slice(0, limit);

  return (
    <section className={`signalSection ${category}`}>
      <header>
        <h3>{categoryLabels[category]}</h3>
        <span>{analysis.signals[category].length} matches</span>
      </header>
      <p>{categoryNotes[category]}</p>
      <ol className="evidenceList">
        {signals.map((signal) => {
          const sourcePost = postsByNumber.get(signal.postNumber);
          if (!sourcePost) {
            return null;
          }

          return (
            <li key={`${signal.category}-${signal.postNumber}`}>
              <p>{signal.evidence}</p>
              <EvidenceDrawer
                label={`#${signal.postNumber} · @${signal.username}`}
                post={sourcePost}
                sourceUrl={sourceUrl}
                signal={signal}
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
}: {
  author: AuthorSummary;
  posts: TopicPost[];
  sourceUrl: string;
}) {
  return (
    <details className="authorRow">
      <summary>
        <span>@{author.username}</span>
        <em>
          {author.posts} posts · {author.quotesReceived} quotes received
        </em>
      </summary>
      <div className="authorDetails">
        <p>
          Active from {formatDate(author.firstPostAt)} to {formatDate(author.lastPostAt)}. Heuristic
          signals: {author.signalCounts.agreement} convergence,{" "}
          {author.signalCounts.disagreement} contested, {author.signalCounts.question} questions,{" "}
          {author.signalCounts.progress} progress.
        </p>
        <div className="miniPostList">
          {posts.slice(0, 5).map((post) => (
            <EvidenceDrawer
              key={post.id}
              label={`#${post.post_number}`}
              post={post}
              sourceUrl={sourceUrl}
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
}: {
  label: string;
  post: TopicPost;
  sourceUrl: string;
  signal?: Signal;
}) {
  return (
    <details className="evidenceDrawer">
      <summary>{label}</summary>
      <SourcePreview post={post} signal={signal} sourceUrl={sourceUrl} />
    </details>
  );
}

function SourceTimeline({
  posts,
  activePostNumber,
  onActivePostChange,
  sourceListRef,
}: {
  posts: TopicPost[];
  activePostNumber: number | null;
  onActivePostChange: (postNumber: number) => void;
  sourceListRef: RefObject<HTMLDivElement | null>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const lastDraggedPostRef = useRef<number | null>(null);
  const pendingRatioRef = useRef<number | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
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
    };
  }, []);

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
    onActivePostChange(post.post_number);
  }

  function scrollToTimelineRatio(ratio: number) {
    const sourceList = sourceListRef.current;
    if (!sourceList) {
      return;
    }

    applyTimelineRatio(ratio);
    const maxScroll = Math.max(0, sourceList.scrollHeight - sourceList.clientHeight);
    sourceList.scrollTop = maxScroll * ratio;
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

      scrollToTimelineRatio(pendingRatio);
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    scheduleTimelineScroll(event.clientY);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging) {
      return;
    }
    scheduleTimelineScroll(event.clientY);
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    lastDraggedPostRef.current = null;
    pendingRatioRef.current = null;
    setIsDragging(false);
  }

  return (
    <aside className="sourceTimeline" aria-label="Source timeline">
      <div className="timelineCard">
        <a className="timelineMonth timelineMonthStart" href={firstPost ? `#post-${firstPost.post_number}` : "#source"}>
          {formatMonth(firstPost?.created_at ?? "")}
        </a>
        <div
          aria-label={`Currently near post ${activeIndex + 1} of ${posts.length}, ${formatMonth(
            activePost?.created_at ?? "",
          )}`}
          className={`timelineTrack${isDragging ? " isDragging" : ""}`}
          onPointerCancel={handlePointerEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          ref={trackRef}
        >
          <div className="timelineLine" />
          <button
            aria-label={`Drag timeline marker. Currently near post ${activeIndex + 1} of ${posts.length}`}
            className="timelineHandle"
            style={{ top: `${handleTop}%` }}
            type="button"
          >
            <strong>
              {numberFormatter.format(activeIndex + 1)} / {numberFormatter.format(posts.length)}
            </strong>
            <span>{formatMonth(activePost?.created_at ?? "")}</span>
          </button>
        </div>
        <a className="timelineMonth timelineMonthEnd" href={lastPost ? `#post-${lastPost.post_number}` : "#source"}>
          {formatMonth(lastPost?.created_at ?? "")}
        </a>
      </div>
    </aside>
  );
}

function SourceMessage({
  post,
  sourceUrl,
  expanded = false,
}: {
  post: TopicPost;
  sourceUrl: string;
  expanded?: boolean;
}) {
  return (
    <details className="sourceMessage" id={`post-${post.post_number}`} open={expanded}>
      <summary>
        <span>#{post.post_number}</span>
        <strong>@{post.username}</strong>
        <em>{formatTime(post.created_at)}</em>
      </summary>
      <SourcePreview post={post} showRaw sourceUrl={sourceUrl} />
    </details>
  );
}

function SourcePreview({
  post,
  sourceUrl,
  signal,
  showRaw = false,
}: {
  post: TopicPost;
  sourceUrl: string;
  signal?: Signal;
  showRaw?: boolean;
}) {
  return (
    <article className="sourcePreview">
      <header>
        <div>
          <p>
            #{post.post_number} by @{post.username}
          </p>
          <time dateTime={post.created_at}>{formatTime(post.created_at)}</time>
        </div>
        <a href={sourcePostUrl(sourceUrl, post.post_number)}>Open source</a>
      </header>

      {signal ? (
        <p className="matchNote">Matched: {signal.matchedTerms.slice(0, 4).join(", ")}</p>
      ) : null}

      <div
        className="postBody discoursePost"
        dangerouslySetInnerHTML={{ __html: cookedHtml(post) }}
      />

      <dl className="sourceStats">
        <Field label="Replies" value={post.reply_count} />
        <Field label="Quotes" value={post.quote_count} />
        <Field label="Reads" value={post.reads} />
        <Field label="Score" value={Math.round(post.score)} />
      </dl>

      {showRaw ? (
        <details className="rawSource">
          <summary>Raw markdown and JSON</summary>
          <pre>{post.raw || "No raw markdown in this record."}</pre>
          <pre>{JSON.stringify(post, null, 2)}</pre>
        </details>
      ) : null}
    </article>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{typeof value === "number" ? numberFormatter.format(value) : value}</dd>
    </div>
  );
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
