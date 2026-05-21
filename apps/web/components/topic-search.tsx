"use client";

import {
  FormEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import GitHubLink from "@/components/github-link";
import HowItWorksLink from "@/components/how-it-works-link";
import { clientApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/styles";
import type { TopicListItem, TopicListResponse } from "@/lib/types";
import { topicHref } from "@/topic/routes";

type ResolvedTopic = {
  topic: {
    topic_id: number;
    title: string;
    url: string;
    posts_count: number;
    last_posted_at: string;
  };
};

type TopicListKind = "recent" | "new";

type TopicListState = {
  data: TopicListResponse | null;
  fetchedAt: number;
  isLoading: boolean;
  error: string | null;
};

const TOPIC_LIST_STALE_MS = 5 * 60 * 1000;
const TOPIC_LIST_TABS: { kind: TopicListKind; label: string; deck: string }[] = [
  {
    kind: "recent",
    label: "Recently updated",
    deck: "Threads with the most recent activity on discuss.python.org.",
  },
  {
    kind: "new",
    label: "New threads",
    deck: "Fresh topics that have just entered the discussion stream.",
  },
];

const primaryButton =
  "min-h-12 rounded-lg border border-[#f5c06f] bg-[#f5c06f] px-4.5 font-black text-kiri-ink enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-55";
const tabButton =
  "min-h-[38px] rounded-lg border border-transparent px-3 py-2 text-left text-sm font-extrabold text-[#dceae2] enabled:cursor-pointer hover:bg-white/10";
const activeTabButton =
  "border-[#f5c06f]/90 bg-[#f5c06f] text-kiri-ink hover:bg-[#f5c06f]";
const panelButton =
  "grid min-h-[38px] place-items-center whitespace-nowrap rounded-lg border border-kiri-hero/20 px-3 font-extrabold no-underline";

export default function TopicSearch() {
  const router = useRouter();
  const [topicInput, setTopicInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeList, setActiveList] = useState<TopicListKind>("recent");
  const [topicLists, setTopicLists] = useState<Record<TopicListKind, TopicListState>>({
    recent: emptyTopicListState(),
    new: emptyTopicListState(),
  });
  const topicListsRef = useRef(topicLists);

  const activeTopicList = topicLists[activeList];

  const refreshTopicList = useCallback(async (kind: TopicListKind, force = false) => {
    const current = topicListsRef.current[kind];
    if (
      !force &&
      (current.isLoading ||
        (current.data && Date.now() - current.fetchedAt < TOPIC_LIST_STALE_MS))
    ) {
      return;
    }

    topicListsRef.current = {
      ...topicListsRef.current,
      [kind]: {
        ...current,
        isLoading: true,
        error: null,
      },
    };
    setTopicLists(topicListsRef.current);

    try {
      const response = await fetch(
        `${clientApiBaseUrl()}/api/topics/${kind}?limit=20`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || `Request failed with ${response.status}`);
      }

      topicListsRef.current = {
        ...topicListsRef.current,
        [kind]: {
          data: payload as TopicListResponse,
          fetchedAt: Date.now(),
          isLoading: false,
          error: null,
        },
      };
      setTopicLists(topicListsRef.current);
    } catch (listError) {
      topicListsRef.current = {
        ...topicListsRef.current,
        [kind]: {
          ...topicListsRef.current[kind],
          isLoading: false,
          error:
            listError instanceof Error ? listError.message : "Unable to load topics.",
        },
      };
      setTopicLists(topicListsRef.current);
    }
  }, []);

  useEffect(() => {
    topicListsRef.current = topicLists;
  }, [topicLists]);

  useEffect(() => {
    void refreshTopicList("recent");
    void refreshTopicList("new");
  }, [refreshTopicList]);

  useEffect(() => {
    function refreshMissingOrStaleLists(force = false) {
      for (const kind of TOPIC_LIST_TABS.map((tab) => tab.kind)) {
        const current = topicListsRef.current[kind];
        if (
          force ||
          !current.data ||
          Date.now() - current.fetchedAt >= TOPIC_LIST_STALE_MS
        ) {
          void refreshTopicList(kind, force);
        }
      }
    }

    function handlePageShow(event: PageTransitionEvent) {
      refreshMissingOrStaleLists(event.persisted);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshMissingOrStaleLists();
      }
    }

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshTopicList]);

  useEffect(() => {
    void refreshTopicList(activeList);
  }, [activeList, refreshTopicList]);

  useEffect(() => {
    if (!activeTopicList.data) {
      return undefined;
    }
    const staleInMs = TOPIC_LIST_STALE_MS - (Date.now() - activeTopicList.fetchedAt);
    const timeout = window.setTimeout(
      () => {
        void refreshTopicList(activeList);
      },
      Math.max(staleInMs + 250, 1_000),
    );
    return () => window.clearTimeout(timeout);
  }, [activeList, activeTopicList.data, activeTopicList.fetchedAt, refreshTopicList]);

  const activeTab = useMemo(
    () => TOPIC_LIST_TABS.find((tab) => tab.kind === activeList) ?? TOPIC_LIST_TABS[0],
    [activeList],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = topicInput.trim();
    if (!value) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${clientApiBaseUrl()}/api/topics/resolve?input=${encodeURIComponent(value)}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail || `Request failed with ${response.status}`);
      }

      const resolved = payload as ResolvedTopic;
      router.push(topicHref(resolved.topic.topic_id));
    } catch (lookupError) {
      setError(
        lookupError instanceof Error ? lookupError.message : "Unable to load topic.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleScrollCueClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const target = document.getElementById("topic-discovery");
    if (!target) {
      return;
    }

    const startY = window.scrollY;
    const targetY = Math.ceil(target.getBoundingClientRect().top + startY);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo({ top: targetY, behavior: "auto" });
      return;
    }

    const durationMs = 1000;
    const startedAt = window.performance.now();

    function step(now: number) {
      const progress = Math.min(1, (now - startedAt) / durationMs);

      window.scrollTo({
        top: startY + (targetY - startY) * progress,
        behavior: "auto",
      });

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    }

    window.requestAnimationFrame(step);
  }

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-clip">
      <section className="flex min-h-screen flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_78%_12%,rgba(245,192,111,0.2),transparent_28%),linear-gradient(135deg,var(--hero)_0%,var(--hero-2)_58%,#5f4a35_100%)] px-[clamp(20px,5vw,80px)] pt-[clamp(36px,6vw,84px)] pb-[clamp(28px,4vw,48px)] max-sm:px-4.5 max-sm:py-8">
        <div>
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-[clamp(14px,2vw,28px)]">
            <svg
              aria-hidden="true"
              className="bg-kiri-surface h-[clamp(5.25rem,12.8vw,12.25rem)] w-[clamp(5.25rem,12.8vw,12.25rem)] shrink-0 overflow-hidden rounded-xl border border-white/25 shadow-[0_20px_54px_rgba(0,0,0,0.22)]"
              viewBox="0 0 44 44"
            >
              <rect width="44" height="44" fill="#f8fbf8" />
              <path d="M0 0h44L22 22z" fill="#d4edf7" />
              <path d="M0 0l22 22L0 44z" fill="#4c9bd3" />
              <path d="M44 0v44L22 22z" fill="#f5c06f" />
              <path d="M0 44h44L22 22z" fill="#0a6b96" />
              <path d="M22 12l9 21h-6l-3-8-3 8h-6z" fill="#16322b" />
            </svg>
            <div className="min-w-0">
              <p className="text-[clamp(3.25rem,8.8vw,8.5rem)] leading-[0.95] font-black tracking-normal text-[#fbfffc]">
                Kirigami
              </p>
              <p className="mt-[clamp(0.35rem,0.9vw,0.85rem)] text-[clamp(1.38rem,3.1vw,2.88rem)] leading-none font-black whitespace-nowrap text-[#f5c06f]">
                Consensus Not Included
              </p>
            </div>
          </div>
          <h1 className="mt-5 max-w-5xl text-[clamp(1.65rem,3.25vw,3.3rem)] leading-[1.02] font-black tracking-normal text-[#fbfffc] max-sm:text-[1.8rem]">
            Understand long Discourse threads without losing the discussion.
          </h1>
          <p className="mt-5 max-w-[900px] text-[clamp(1.05rem,1.45vw,1.32rem)] leading-relaxed text-[#dceae2]">
            Kirigami turns a discuss.python.org topic into a guided reading workspace:
            summary, evidence, participant signals, and the original source posts stay
            connected.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <HowItWorksLink className="text-kiri-ink border-[#f5c06f] bg-[#f5c06f] shadow-[0_14px_32px_rgba(0,0,0,0.16)] hover:bg-[#ffd180] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5c06f]" />
            <GitHubLink className="border-white/25 bg-white/12 text-[#fbfffc] shadow-[0_14px_32px_rgba(0,0,0,0.14)] hover:bg-white/18 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5c06f]" />
          </div>
          <div
            className="mt-8 grid max-w-[1180px] grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/20 bg-white/20 max-lg:grid-cols-1"
            aria-label="Project overview"
          >
            {[
              [
                "What it does",
                "It fetches a live thread, groups the conversation into readable views, and keeps every claim tied back to source posts.",
              ],
              [
                "Why it exists",
                "Standards discussions are dense. This helps you see where people align, where objections remain, and who shaped the exchange.",
              ],
              [
                "How to start",
                "Enter a DPO topic URL or numeric topic ID. The backend collects the posts and opens the reader for that exact thread.",
              ],
            ].map(([title, body]) => (
              <section className="min-w-0 bg-white/10 p-4.5" key={title}>
                <h2 className="text-[0.82rem] leading-tight font-black text-[#fbfffc] uppercase">
                  {title}
                </h2>
                <p className="mt-2 text-[0.94rem] leading-normal text-[#dceae2]">
                  {body}
                </p>
              </section>
            ))}
          </div>
          <form
            className="mt-7 grid max-w-[1040px] grid-cols-[minmax(0,1fr)_auto] items-end gap-3 max-sm:grid-cols-1"
            onSubmit={handleSubmit}
          >
            <label
              className="grid gap-2 text-[0.84rem] font-extrabold text-[#dceae2]"
              htmlFor="topic-input"
            >
              Topic URL or ID
              <input
                autoComplete="off"
                className="min-h-12 min-w-0 rounded-lg border border-white/25 bg-white/10 px-3.5 text-[#fbfffc] outline-0 placeholder:text-[#b6c3bd] focus:border-[#f5c06f] focus:shadow-[0_0_0_3px_rgba(245,192,111,0.22)]"
                id="topic-input"
                placeholder="https://discuss.python.org/t/topic-title/12345"
                value={topicInput}
                onChange={(event) => setTopicInput(event.target.value)}
              />
            </label>
            <button
              className={primaryButton}
              disabled={isLoading || !topicInput.trim()}
              type="submit"
            >
              {isLoading ? "Loading" : "Open reader"}
            </button>
          </form>
          {error ? (
            <p className="mt-3.5 font-extrabold text-[#ffe0cc]">{error}</p>
          ) : null}
        </div>
        <a
          className="mt-8 grid h-12 w-12 place-items-center self-center rounded-full border border-white/30 bg-white/12 text-[#fbfffc] shadow-[0_14px_32px_rgba(0,0,0,0.18)] transition hover:translate-y-1 hover:bg-white/18 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#f5c06f]"
          href="#topic-discovery"
          aria-label="Scroll to topic feed"
          onClick={handleScrollCueClick}
        >
          <span className="grid h-6 w-6 animate-bounce place-items-center">
            <svg
              className="h-6 w-6 translate-y-0.5"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.25"
              />
            </svg>
          </span>
        </a>
      </section>
      <section
        id="topic-discovery"
        className="w-full bg-[linear-gradient(180deg,var(--background)_0%,#ccd9d2_100%)] px-[clamp(20px,5vw,80px)] py-11 pb-[72px] max-sm:px-2.5 max-sm:py-8 max-sm:pb-12"
        aria-labelledby="topic-discovery-heading"
      >
        <div className="flex min-w-0 items-end justify-between gap-6 max-lg:flex-col max-lg:items-stretch">
          <div>
            <h2
              className="max-w-[980px] text-[clamp(2rem,4vw,4rem)] leading-[1.04] font-black tracking-normal"
              id="topic-discovery-heading"
            >
              Pick a thread from the current discussion stream.
            </h2>
          </div>
          <button
            className="border-kiri-hero bg-kiri-hero min-h-[38px] w-fit shrink-0 rounded-lg border px-3.5 font-extrabold text-[#fbfffc] enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-55"
            disabled={activeTopicList.isLoading}
            type="button"
            onClick={() => void refreshTopicList(activeList, true)}
          >
            {activeTopicList.isLoading ? "Refreshing" : "Refresh"}
          </button>
        </div>
        <div
          className="border-kiri-hero/15 bg-kiri-hero/85 shadow-kiri-subtle mt-6.5 flex flex-wrap gap-1.5 rounded-lg border p-1.5 max-sm:grid max-sm:grid-cols-1"
          role="tablist"
          aria-label="Topic feeds"
        >
          {TOPIC_LIST_TABS.map((tab) => (
            <button
              aria-selected={activeList === tab.kind}
              className={cn(tabButton, activeList === tab.kind && activeTabButton)}
              key={tab.kind}
              role="tab"
              type="button"
              onClick={() => setActiveList(tab.kind)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          className="border-kiri-hero/15 shadow-kiri-card mt-3.5 rounded-lg border bg-[linear-gradient(180deg,#fbfdfb,#eef5f1)] p-4.5 max-sm:p-2.5"
          role="tabpanel"
        >
          <div className="text-kiri-muted mb-3.5 flex items-center justify-between gap-3.5 text-[0.93rem] font-bold max-lg:flex-col max-lg:items-stretch">
            <p>{activeTab.deck}</p>
            {activeTopicList.data ? (
              <span className="border-kiri-hero/20 w-fit rounded-full border bg-white/70 px-2.5 py-1.5 text-[0.83rem] font-bold">
                Cached until {formatTime(activeTopicList.data.expires_at)}
              </span>
            ) : null}
          </div>
          {activeTopicList.error ? (
            <p className="bg-kiri-contest-soft text-kiri-contest rounded-lg p-4.5 font-extrabold">
              {activeTopicList.error}
            </p>
          ) : null}
          {!activeTopicList.data ? (
            <p className="text-kiri-muted rounded-lg bg-white/70 p-4.5 font-extrabold">
              {activeTopicList.error
                ? "Topic feed is unavailable."
                : "Loading topics..."}
            </p>
          ) : (
            <TopicList topics={activeTopicList.data.topics} />
          )}
        </div>
      </section>
    </main>
  );
}

function emptyTopicListState(): TopicListState {
  return {
    data: null,
    fetchedAt: 0,
    isLoading: false,
    error: null,
  };
}

function TopicList({ topics }: { topics: TopicListItem[] }) {
  if (topics.length === 0) {
    return (
      <p className="text-kiri-muted rounded-lg bg-white/70 p-4.5 font-extrabold">
        No topics returned yet.
      </p>
    );
  }

  return (
    <ol className="grid list-none gap-2.5 p-0">
      {topics.map((topic) => (
        <li
          className="border-kiri-line border-l-kiri-accent grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(400px,0.62fr)_auto] items-center gap-4 rounded-lg border border-l-[5px] bg-white/80 p-4 max-lg:grid-cols-1 max-sm:p-3.5"
          key={topic.topic_id}
        >
          <div className="min-w-0">
            <a
              className="text-kiri-hero decoration-kiri-accent/35 text-[1.05rem] leading-tight font-black [overflow-wrap:anywhere] underline underline-offset-3"
              href={topicHref(topic.topic_id)}
            >
              {topic.title}
            </a>
            {topic.excerpt ? (
              <p className="text-kiri-muted mt-1.5 text-[0.94rem] leading-normal">
                {topic.excerpt}
              </p>
            ) : null}
          </div>
          <dl
            className="border-kiri-line bg-kiri-line [&_dd]:text-kiri-ink [&_dt]:text-kiri-muted grid min-w-0 grid-cols-4 gap-px overflow-hidden rounded-lg border max-sm:grid-cols-2 [&_dd]:mt-1 [&_dd]:text-[0.88rem] [&_dd]:font-extrabold [&_dd]:[overflow-wrap:anywhere] [&_dt]:text-[0.68rem] [&_dt]:font-black [&_dt]:uppercase"
            aria-label={`${topic.title} stats`}
          >
            <div className="bg-kiri-surface min-w-0 p-2.5">
              <dt>Replies</dt>
              <dd>{topic.reply_count}</dd>
            </div>
            <div className="bg-kiri-surface min-w-0 p-2.5">
              <dt>Views</dt>
              <dd>{formatNumber(topic.views)}</dd>
            </div>
            <div className="bg-kiri-surface min-w-0 p-2.5">
              <dt>Latest</dt>
              <dd>{formatDate(topic.last_posted_at ?? topic.bumped_at)}</dd>
            </div>
            <div className="bg-kiri-surface min-w-0 p-2.5">
              <dt>By</dt>
              <dd>
                {topic.last_poster_username ? `@${topic.last_poster_username}` : "DPO"}
              </dd>
            </div>
          </dl>
          <div className="grid gap-2 max-lg:grid-cols-[repeat(2,minmax(0,max-content))]">
            <a
              className={cn(
                panelButton,
                "border-kiri-hero bg-kiri-hero text-[#fbfffc]",
              )}
              href={topicHref(topic.topic_id)}
            >
              Open reader
            </a>
            <a
              className={cn(panelButton, "bg-kiri-surface text-kiri-hero")}
              href={topic.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              Source
            </a>
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "soon";
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: value >= 1000 ? "compact" : "standard",
  }).format(value);
}
