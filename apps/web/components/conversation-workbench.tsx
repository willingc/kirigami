"use client";

import { useMemo, useState } from "react";
import {
  analyzeConversation,
  cookedHtml,
  postText,
  postUrl,
} from "@/topic/analysis";
import type {
  ConversationAnalysis,
  Phase,
  Signal,
  SignalCategory,
  TopicMeta,
  TopicPost,
} from "@/topic/types";

type View = "overview" | "positions" | "authors" | "source";

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

const categoryLabels: Record<SignalCategory, string> = {
  agreement: "Agreement",
  disagreement: "Disagreement",
  question: "Questions",
  progress: "Progress",
};

const categoryDescriptions: Record<SignalCategory, string> = {
  agreement: "Posts with language that suggests support, consensus, or acceptance.",
  disagreement: "Posts with language that suggests concern, objection, risk, or pushback.",
  question: "Posts that ask for clarification or open a thread of inquiry.",
  progress: "Posts that mention proposals, revisions, decisions, next steps, or changes.",
};

export default function ConversationWorkbench({
  posts,
  meta,
}: {
  posts: TopicPost[];
  meta: TopicMeta;
}) {
  const analysis = useMemo(() => analyzeConversation(posts), [posts]);
  const [view, setView] = useState<View>("overview");
  const [activeAuthor, setActiveAuthor] = useState(analysis.authors[0]?.username ?? "");
  const [sourceQuery, setSourceQuery] = useState("");
  const [sourceCategory, setSourceCategory] = useState<SignalCategory | "all">("all");
  const [focusedPost, setFocusedPost] = useState<number | null>(null);

  const postsByNumber = useMemo(
    () => new Map(posts.map((post) => [post.post_number, post])),
    [posts],
  );

  function jumpToPost(postNumber: number) {
    setView("source");
    setFocusedPost(postNumber);
    window.requestAnimationFrame(() => {
      document.getElementById(`post-${postNumber}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <main className="shell">
      <TopicCompass meta={meta} analysis={analysis} />

      <section className="workbench" aria-label="Kirigami conversation workbench">
        <aside className="mapRail" aria-label="Conversation map">
          <ConversationMap
            analysis={analysis}
            activeAuthor={activeAuthor}
            activeView={view}
            onAuthorChange={(username) => {
              setActiveAuthor(username);
              setView("authors");
            }}
            onViewChange={setView}
            onJumpToPost={jumpToPost}
          />
        </aside>

        <section className="mainPane" aria-label="Conversation views">
          <ViewTabs activeView={view} onViewChange={setView} />

          {view === "overview" ? (
            <OverviewView
              analysis={analysis}
              postsByNumber={postsByNumber}
              onJumpToPost={jumpToPost}
            />
          ) : null}

          {view === "positions" ? (
            <PositionsView analysis={analysis} onJumpToPost={jumpToPost} />
          ) : null}

          {view === "authors" ? (
            <AuthorsView
              posts={posts}
              analysis={analysis}
              activeAuthor={activeAuthor}
              onAuthorChange={setActiveAuthor}
              onJumpToPost={jumpToPost}
            />
          ) : null}

          {view === "source" ? (
            <SourceView
              posts={posts}
              analysis={analysis}
              query={sourceQuery}
              category={sourceCategory}
              focusedPost={focusedPost}
              onQueryChange={setSourceQuery}
              onCategoryChange={setSourceCategory}
            />
          ) : null}
        </section>
      </section>
    </main>
  );
}

function TopicCompass({
  meta,
  analysis,
}: {
  meta: TopicMeta;
  analysis: ConversationAnalysis;
}) {
  return (
    <header className="topicCompass">
      <div className="topicTitleBlock">
        <p className="eyebrow">Kirigami conversation workbench</p>
        <h1>{meta.title}</h1>
        <p className="topicSubtitle">
          Topic {meta.topicId} from {meta.dataFile}. Source messages stay first-class;
          every computed signal links back to exact posts.
        </p>
      </div>

      <div className="compassActions">
        <a href={meta.sourceUrl} className="sourceLink">
          Open Discourse topic
        </a>
        <span className="methodBadge">Heuristics only</span>
      </div>

      <dl className="metricStrip" aria-label="Conversation metrics">
        <Metric label="Posts" value={analysis.metrics.posts} />
        <Metric label="Authors" value={analysis.metrics.participants} />
        <Metric label="Read time" value={`${analysis.metrics.estimatedReadMinutes} min`} />
        <Metric label="Quoted posts" value={analysis.metrics.quotes} />
        <Metric label="Reads" value={analysis.metrics.reads} />
        <Metric
          label="Date range"
          value={`${formatDate(analysis.metrics.firstPostAt)} to ${formatDate(
            analysis.metrics.lastPostAt,
          )}`}
        />
      </dl>
    </header>
  );
}

function ConversationMap({
  analysis,
  activeAuthor,
  activeView,
  onAuthorChange,
  onViewChange,
  onJumpToPost,
}: {
  analysis: ConversationAnalysis;
  activeAuthor: string;
  activeView: View;
  onAuthorChange: (username: string) => void;
  onViewChange: (view: View) => void;
  onJumpToPost: (postNumber: number) => void;
}) {
  return (
    <div className="railStack">
      <section className="railSection">
        <h2>Views</h2>
        <div className="railNav">
          {(["overview", "positions", "authors", "source"] as View[]).map((view) => (
            <button
              className={activeView === view ? "railNavButton active" : "railNavButton"}
              key={view}
              onClick={() => onViewChange(view)}
              type="button"
            >
              {viewLabel(view)}
            </button>
          ))}
        </div>
      </section>

      <section className="railSection">
        <div className="sectionHeaderCompact">
          <h2>Phases</h2>
          <span>{analysis.phases.length}</span>
        </div>
        <ol className="phaseList">
          {analysis.phases.map((phase) => (
            <li key={phase.id}>
              <button onClick={() => onJumpToPost(phase.postStart)} type="button">
                <strong>{phase.label}</strong>
                <span>
                  #{phase.postStart}-#{phase.postEnd} · {phase.postCount} posts
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="railSection">
        <div className="sectionHeaderCompact">
          <h2>Authors</h2>
          <span>{analysis.authors.length}</span>
        </div>
        <div className="authorRailList">
          {analysis.authors.slice(0, 12).map((author) => (
            <button
              className={activeAuthor === author.username ? "authorRailButton active" : "authorRailButton"}
              key={author.username}
              onClick={() => onAuthorChange(author.username)}
              type="button"
            >
              <span>@{author.username}</span>
              <strong>{author.posts}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="railSection">
        <div className="sectionHeaderCompact">
          <h2>Most Quoted</h2>
          <span>evidence</span>
        </div>
        <ol className="quoteTargetList">
          {analysis.topQuoteTargets.map((target) => (
            <li key={target.postNumber}>
              <button onClick={() => onJumpToPost(target.postNumber)} type="button">
                <span>#{target.postNumber}</span>
                <strong>{target.count}</strong>
                <em>@{target.username}</em>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function ViewTabs({
  activeView,
  onViewChange,
}: {
  activeView: View;
  onViewChange: (view: View) => void;
}) {
  return (
    <div className="viewTabs" role="tablist" aria-label="Conversation views">
      {(["overview", "positions", "authors", "source"] as View[]).map((view) => (
        <button
          aria-selected={activeView === view}
          className={activeView === view ? "tabButton active" : "tabButton"}
          key={view}
          onClick={() => onViewChange(view)}
          role="tab"
          type="button"
        >
          {viewLabel(view)}
        </button>
      ))}
    </div>
  );
}

function OverviewView({
  analysis,
  postsByNumber,
  onJumpToPost,
}: {
  analysis: ConversationAnalysis;
  postsByNumber: Map<number, TopicPost>;
  onJumpToPost: (postNumber: number) => void;
}) {
  return (
    <div className="viewStack">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Conversation shape</p>
            <h2>Progress through the thread</h2>
          </div>
          <p>Activity and stance signals are computed from dates, quotes, and keywords.</p>
        </div>
        <div className="phaseGrid">
          {analysis.phases.map((phase) => (
            <PhaseCard key={phase.id} phase={phase} onJumpToPost={onJumpToPost} />
          ))}
        </div>
      </section>

      <section className="signalOverviewGrid">
        {(["agreement", "disagreement", "question", "progress"] as SignalCategory[]).map(
          (category) => (
            <section className="panel" key={category}>
              <div className="panelHeader compact">
                <div>
                  <p className="eyebrow">{categoryLabels[category]}</p>
                  <h2>Top signals</h2>
                </div>
              </div>
              <SignalList
                signals={analysis.signals[category].slice(0, 4)}
                onJumpToPost={onJumpToPost}
              />
            </section>
          ),
        )}
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Source anchors</p>
            <h2>Posts repeatedly pulled back into the debate</h2>
          </div>
        </div>
        <div className="anchorGrid">
          {analysis.topQuoteTargets.slice(0, 6).map((target) => {
            const post = postsByNumber.get(target.postNumber);
            return (
              <button
                className="anchorCard"
                key={target.postNumber}
                onClick={() => onJumpToPost(target.postNumber)}
                type="button"
              >
                <span>#{target.postNumber}</span>
                <strong>@{target.username}</strong>
                <p>{post ? postText(post).slice(0, 180) : "Quoted source post"}</p>
                <em>{target.count} quote references</em>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PositionsView({
  analysis,
  onJumpToPost,
}: {
  analysis: ConversationAnalysis;
  onJumpToPost: (postNumber: number) => void;
}) {
  return (
    <div className="viewStack">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Heuristic position map</p>
            <h2>Agreement, disagreement, questions, and progress</h2>
          </div>
          <p>
            These are evidence lanes, not conclusions. Each item is a post that matched explicit
            terms.
          </p>
        </div>
      </section>
      <div className="positionGrid">
        {(["agreement", "disagreement", "question", "progress"] as SignalCategory[]).map(
          (category) => (
            <section className={`positionLane ${category}`} key={category}>
              <div className="laneHeader">
                <h2>{categoryLabels[category]}</h2>
                <span>{analysis.signals[category].length}</span>
              </div>
              <p>{categoryDescriptions[category]}</p>
              <SignalList
                signals={analysis.signals[category].slice(0, 14)}
                onJumpToPost={onJumpToPost}
              />
            </section>
          ),
        )}
      </div>
    </div>
  );
}

function AuthorsView({
  posts,
  analysis,
  activeAuthor,
  onAuthorChange,
  onJumpToPost,
}: {
  posts: TopicPost[];
  analysis: ConversationAnalysis;
  activeAuthor: string;
  onAuthorChange: (username: string) => void;
  onJumpToPost: (postNumber: number) => void;
}) {
  const author = analysis.authors.find((candidate) => candidate.username === activeAuthor);
  const authorPosts = posts.filter((post) => post.username === activeAuthor);

  return (
    <div className="authorLayout">
      <section className="authorDirectory panel">
        <div className="panelHeader compact">
          <div>
            <p className="eyebrow">Participants</p>
            <h2>Author lens</h2>
          </div>
        </div>
        <div className="authorDirectoryList">
          {analysis.authors.map((candidate) => (
            <button
              className={candidate.username === activeAuthor ? "authorDirectoryItem active" : "authorDirectoryItem"}
              key={candidate.username}
              onClick={() => onAuthorChange(candidate.username)}
              type="button"
            >
              <span>@{candidate.username}</span>
              <strong>{candidate.posts}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="authorDetail">
        {author ? (
          <>
            <div className="panel authorSummaryPanel">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Selected author</p>
                  <h2>@{author.username}</h2>
                </div>
                <p>
                  {author.posts} posts from {formatDate(author.firstPostAt)} to{" "}
                  {formatDate(author.lastPostAt)}
                </p>
              </div>
              <dl className="compactMetricGrid">
                <Metric label="Posts" value={author.posts} />
                <Metric label="Replies" value={author.replies} />
                <Metric label="Quoted" value={author.quotesReceived} />
                <Metric label="Reads" value={author.reads} />
              </dl>
              <div className="signalPills">
                {(["agreement", "disagreement", "question", "progress"] as SignalCategory[]).map(
                  (category) => (
                    <span className={`signalPill ${category}`} key={category}>
                      {categoryLabels[category]} {author.signalCounts[category]}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="postList">
              {authorPosts.map((post) => (
                <SourcePost
                  focused={false}
                  key={post.id}
                  post={post}
                  signalCategories={postSignalCategories(post.post_number, analysis)}
                  onJumpToPost={onJumpToPost}
                />
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

function SourceView({
  posts,
  analysis,
  query,
  category,
  focusedPost,
  onQueryChange,
  onCategoryChange,
}: {
  posts: TopicPost[];
  analysis: ConversationAnalysis;
  query: string;
  category: SignalCategory | "all";
  focusedPost: number | null;
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: SignalCategory | "all") => void;
}) {
  const signalPostNumbers = useMemo(() => {
    if (category === "all") {
      return null;
    }
    return new Set(analysis.signals[category].map((signal) => signal.postNumber));
  }, [analysis, category]);

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = signalPostNumbers ? signalPostNumbers.has(post.post_number) : true;
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery = normalizedQuery
      ? `${post.username} ${post.post_number} ${postText(post)}`.toLowerCase().includes(normalizedQuery)
      : true;
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="viewStack">
      <section className="panel sourceControls">
        <div>
          <p className="eyebrow">Source messages</p>
          <h2>{filteredPosts.length} visible posts</h2>
        </div>
        <label>
          Search
          <input
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="author, post number, or text"
            value={query}
          />
        </label>
        <label>
          Signal filter
          <select
            onChange={(event) => onCategoryChange(event.target.value as SignalCategory | "all")}
            value={category}
          >
            <option value="all">All posts</option>
            <option value="agreement">Agreement signals</option>
            <option value="disagreement">Disagreement signals</option>
            <option value="question">Question signals</option>
            <option value="progress">Progress signals</option>
          </select>
        </label>
      </section>

      <div className="postList">
        {filteredPosts.map((post) => (
          <SourcePost
            focused={focusedPost === post.post_number}
            key={post.id}
            post={post}
            signalCategories={postSignalCategories(post.post_number, analysis)}
          />
        ))}
      </div>
    </div>
  );
}

function SourcePost({
  post,
  signalCategories,
  focused,
  onJumpToPost,
}: {
  post: TopicPost;
  signalCategories: SignalCategory[];
  focused: boolean;
  onJumpToPost?: (postNumber: number) => void;
}) {
  return (
    <article className={focused ? "sourcePost focused" : "sourcePost"} id={`post-${post.post_number}`}>
      <header className="sourcePostHeader">
        <div>
          <div className="postMeta">
            <span>#{post.post_number}</span>
            <span>@{post.username}</span>
            <time dateTime={post.created_at}>{formatTime(post.created_at)}</time>
          </div>
          <h2>{post.user_title || "Community member"}</h2>
        </div>
        <div className="postActions">
          {onJumpToPost ? (
            <button onClick={() => onJumpToPost(post.post_number)} type="button">
              Open source
            </button>
          ) : null}
          <a href={postUrl(post.post_number)}>Discourse</a>
        </div>
      </header>

      {signalCategories.length > 0 ? (
        <div className="signalPills">
          {signalCategories.map((category) => (
            <span className={`signalPill ${category}`} key={category}>
              {categoryLabels[category]}
            </span>
          ))}
        </div>
      ) : null}

      <div
        className="postBody discoursePost"
        dangerouslySetInnerHTML={{ __html: cookedHtml(post) }}
      />

      <dl className="postStats" aria-label={`Post ${post.post_number} fields`}>
        <Field label="id" value={post.id} />
        <Field label="created_at" value={post.created_at} />
        <Field label="updated_at" value={post.updated_at} />
        <Field label="reply_count" value={post.reply_count} />
        <Field label="quote_count" value={post.quote_count} />
        <Field label="reads" value={post.reads} />
        <Field label="score" value={Math.round(post.score)} />
        <Field label="trust_level" value={post.trust_level ?? "empty"} />
      </dl>

      <details className="sourceDetails">
        <summary>Raw markdown and JSON</summary>
        <div className="detailGrid">
          <pre>{post.raw || "No raw markdown in this record."}</pre>
          <pre>{JSON.stringify(post, null, 2)}</pre>
        </div>
      </details>
    </article>
  );
}

function PhaseCard({
  phase,
  onJumpToPost,
}: {
  phase: Phase;
  onJumpToPost: (postNumber: number) => void;
}) {
  return (
    <button className="phaseCard" onClick={() => onJumpToPost(phase.postStart)} type="button">
      <span>
        #{phase.postStart}-#{phase.postEnd}
      </span>
      <strong>{phase.label}</strong>
      <p>
        {formatDate(phase.startDate)} to {formatDate(phase.endDate)}
      </p>
      <em>{phase.postCount} posts</em>
      <div className="phaseSignals">
        {(["agreement", "disagreement", "question", "progress"] as SignalCategory[]).map(
          (category) => (
            <small className={category} key={category}>
              {phase.signalCounts[category]}
            </small>
          ),
        )}
      </div>
      <p className="phaseAuthors">{phase.dominantAuthors.map((author) => `@${author}`).join(", ")}</p>
    </button>
  );
}

function SignalList({
  signals,
  onJumpToPost,
}: {
  signals: Signal[];
  onJumpToPost: (postNumber: number) => void;
}) {
  return (
    <ol className="signalList">
      {signals.map((signal) => (
        <li key={`${signal.category}-${signal.postNumber}`}>
          <button onClick={() => onJumpToPost(signal.postNumber)} type="button">
            <div className="signalHeader">
              <span className={`signalPill ${signal.category}`}>{categoryLabels[signal.category]}</span>
              <strong>#{signal.postNumber}</strong>
              <em>@{signal.username}</em>
            </div>
            <p>{signal.evidence}</p>
            <small>Matched: {signal.matchedTerms.slice(0, 4).join(", ")}</small>
          </button>
        </li>
      ))}
    </ol>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metricItem">
      <dt>{label}</dt>
      <dd>{typeof value === "number" ? numberFormatter.format(value) : value}</dd>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{typeof value === "number" ? numberFormatter.format(value) : value || "empty"}</dd>
    </div>
  );
}

function postSignalCategories(
  postNumber: number,
  analysis: ConversationAnalysis,
): SignalCategory[] {
  return (["agreement", "disagreement", "question", "progress"] as SignalCategory[]).filter(
    (category) => analysis.signals[category].some((signal) => signal.postNumber === postNumber),
  );
}

function viewLabel(view: View): string {
  return {
    overview: "Overview",
    positions: "Positions",
    authors: "Authors",
    source: "Source",
  }[view];
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
