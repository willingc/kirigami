import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

type TopicPost = {
  id: number;
  post_number: number;
  username: string;
  created_at: string;
  updated_at: string;
  raw: string;
  cooked: string;
  reply_count: number;
  quote_count: number;
  reads: number;
  score: number;
  user_title: string;
  trust_level: number;
};

const DATA_FILE = "topic_102383_posts.json";
const TOPIC_URL = "https://discuss.python.org/t/102383";
const numberFormatter = new Intl.NumberFormat("en");
const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function Home() {
  const posts = await loadTopicPosts();
  const stats = summarize(posts);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Kirigami</p>
          <h1>Topic 102383</h1>
        </div>
        <a href={TOPIC_URL} className="status statusLink">
          Open source topic
        </a>
      </header>

      <section className="workspace" aria-label="Topic data">
        <div className="summaryBand">
          <div>
            <p className="eyebrow">Loaded from data/{DATA_FILE}</p>
            <h2>Wheel Variants discussion posts</h2>
          </div>
          <p className="summaryRange">
            {formatDate(stats.firstPostAt)} to {formatDate(stats.lastPostAt)}
          </p>
        </div>

        <dl className="metricsGrid">
          <Metric label="Posts" value={stats.posts} />
          <Metric label="Participants" value={stats.participants} />
          <Metric label="Replies" value={stats.replies} />
          <Metric label="Reads" value={stats.reads} />
        </dl>

        <section className="feed" aria-labelledby="all-posts">
          <div className="sectionHeader">
            <h2 id="all-posts">All Posts</h2>
            <p>{numberFormatter.format(posts.length)} records</p>
          </div>

          <div className="postList">
            {posts.map((post) => (
              <article className="postCard postRecord" key={post.id}>
                <header className="postRecordHeader">
                  <div>
                    <div className="postMeta">
                      <span>#{post.post_number}</span>
                      <span>@{post.username}</span>
                    </div>
                    <h2>{post.user_title || "Community member"}</h2>
                  </div>
                  <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
                </header>

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
                  <Field label="score" value={post.score} />
                  <Field label="trust_level" value={post.trust_level} />
                </dl>

                <details className="jsonDetails">
                  <summary>Full JSON record</summary>
                  <pre>{JSON.stringify(post, null, 2)}</pre>
                </details>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

async function loadTopicPosts(): Promise<TopicPost[]> {
  const candidates = [
    path.join(process.cwd(), "data", DATA_FILE),
    path.join(process.cwd(), "..", "..", "data", DATA_FILE),
  ];

  for (const candidate of candidates) {
    try {
      const payload = await readFile(candidate, "utf8");
      return JSON.parse(payload) as TopicPost[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  throw new Error(`Unable to find data/${DATA_FILE}`);
}

function summarize(posts: TopicPost[]) {
  const usernames = new Set(posts.map((post) => post.username));

  return {
    posts: posts.length,
    participants: usernames.size,
    replies: posts.reduce((total, post) => total + post.reply_count, 0),
    reads: posts.reduce((total, post) => total + post.reads, 0),
    firstPostAt: posts[0]?.created_at ?? "",
    lastPostAt: posts.at(-1)?.created_at ?? "",
  };
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metricCard">
      <dt>{label}</dt>
      <dd>{numberFormatter.format(value)}</dd>
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

function formatDate(value: string) {
  if (!value) {
    return "Unknown date";
  }

  return dateFormatter.format(new Date(value));
}

function cookedHtml(post: TopicPost) {
  if (post.cooked) {
    return absolutizeDiscourseLinks(post.cooked);
  }

  return `<pre>${escapeHtml(post.raw)}</pre>`;
}

function absolutizeDiscourseLinks(html: string) {
  return html.replace(
    /\b(href|src)="\//g,
    (_match, attribute: string) => `${attribute}="https://discuss.python.org/`,
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
