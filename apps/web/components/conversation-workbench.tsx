"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { analyzeConversation, cookedHtml, postUrl } from "@/topic/analysis";
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

export default function ConversationWorkbench({
  posts,
  meta,
}: {
  posts: TopicPost[];
  meta: TopicMeta;
}) {
  const analysis = useMemo(() => analyzeConversation(posts), [posts]);
  const postsByNumber = useMemo(
    () => new Map(posts.map((post) => [post.post_number, post])),
    [posts],
  );
  const firstPost = posts[0];
  const lastPost = posts.at(-1);

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

        <section className="briefPanel" id="brief">
          <BriefBlock
            title="What this discussion is about"
            body={
              firstPost
                ? `The opening post frames the discussion around Wheel Variants and the difficulty of distributing hardware-specific or platform-dependent Python packages.`
                : "The source data did not include an opening post."
            }
            post={firstPost}
          />
          <BriefBlock
            title="Where it seems to converge"
            body="The strongest convergence evidence is not treated as consensus. It is a shortlist of posts whose wording suggests agreement, support, or acceptance."
            signals={analysis.signals.agreement.slice(0, 3)}
            postsByNumber={postsByNumber}
          />
          <BriefBlock
            title="What remains contested"
            body="The strongest contested evidence is a shortlist of posts that appear to carry concern, objection, risk, or pushback language."
            signals={analysis.signals.disagreement.slice(0, 3)}
            postsByNumber={postsByNumber}
          />
        </section>

        <GuidedSection
          eyebrow="Reading path"
          id="path"
          title="Read the thread in four passes"
          intro="Instead of starting with 225 posts, use the conversation phases as a map. Each phase opens at source level when you need to inspect the underlying messages."
        >
          <div className="pathList">
            {analysis.phases.map((phase) => (
              <PhaseStep key={phase.id} phase={phase} postsByNumber={postsByNumber} />
            ))}
          </div>
        </GuidedSection>

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
              limit={6}
            />
            <SignalSection
              analysis={analysis}
              category="disagreement"
              postsByNumber={postsByNumber}
              limit={6}
            />
            <SignalSection
              analysis={analysis}
              category="question"
              postsByNumber={postsByNumber}
              limit={5}
            />
            <SignalSection
              analysis={analysis}
              category="progress"
              postsByNumber={postsByNumber}
              limit={5}
            />
          </div>
        </GuidedSection>

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
              />
            ))}
          </div>
        </GuidedSection>

        <GuidedSection
          eyebrow="Source"
          id="source"
          title="Source messages remain available"
          intro="The full thread is preserved below. Messages are collapsed by default so the page stays readable."
        >
          <div className="sourceList">
            {posts.map((post) => (
              <SourceMessage key={post.id} post={post} />
            ))}
          </div>
        </GuidedSection>

        {lastPost ? (
          <footer className="readerFooter">
            Last source post in this JSON: #{lastPost.post_number} by @{lastPost.username} on{" "}
            {formatTime(lastPost.created_at)}.
          </footer>
        ) : null}
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
}: {
  title: string;
  body: string;
  post?: TopicPost;
  signals?: Signal[];
  postsByNumber?: Map<number, TopicPost>;
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
        <EvidenceDrawer label={`#${post.post_number}`} post={post} />
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
}: {
  phase: Phase;
  postsByNumber: Map<number, TopicPost>;
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
          {openingPost ? <EvidenceDrawer label={`Open #${phase.postStart}`} post={openingPost} /> : null}
          {closingPost && closingPost.post_number !== openingPost?.post_number ? (
            <EvidenceDrawer label={`Close #${phase.postEnd}`} post={closingPost} />
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
  limit,
}: {
  analysis: ConversationAnalysis;
  category: SignalCategory;
  postsByNumber: Map<number, TopicPost>;
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
}: {
  author: AuthorSummary;
  posts: TopicPost[];
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
  signal,
}: {
  label: string;
  post: TopicPost;
  signal?: Signal;
}) {
  return (
    <details className="evidenceDrawer">
      <summary>{label}</summary>
      <SourcePreview post={post} signal={signal} />
    </details>
  );
}

function SourceMessage({ post }: { post: TopicPost }) {
  return (
    <details className="sourceMessage" id={`post-${post.post_number}`}>
      <summary>
        <span>#{post.post_number}</span>
        <strong>@{post.username}</strong>
        <em>{formatTime(post.created_at)}</em>
      </summary>
      <SourcePreview post={post} showRaw />
    </details>
  );
}

function SourcePreview({
  post,
  signal,
  showRaw = false,
}: {
  post: TopicPost;
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
        <a href={postUrl(post.post_number)}>Open source</a>
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
