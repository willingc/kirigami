"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { clientApiBaseUrl } from "@/lib/api";
import type { TopicListItem, TopicListResponse } from "@/lib/types";

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
            listError instanceof Error
              ? listError.message
              : "Unable to load topics.",
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
    void refreshTopicList(activeList);
  }, [activeList, refreshTopicList]);

  useEffect(() => {
    if (!activeTopicList.data) {
      return undefined;
    }
    const staleInMs = TOPIC_LIST_STALE_MS - (Date.now() - activeTopicList.fetchedAt);
    const timeout = window.setTimeout(() => {
      void refreshTopicList(activeList);
    }, Math.max(staleInMs + 250, 1_000));
    return () => window.clearTimeout(timeout);
  }, [activeList, activeTopicList.data, activeTopicList.fetchedAt, refreshTopicList]);

  const activeTab = useMemo(
    () =>
      TOPIC_LIST_TABS.find((tab) => tab.kind === activeList) ?? TOPIC_LIST_TABS[0],
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
      router.push(`/topics/${resolved.topic.topic_id}`);
    } catch (lookupError) {
      setError(
        lookupError instanceof Error ? lookupError.message : "Unable to load topic.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="homeShell">
      <section className="homeHero">
        <p className="eyebrow">Kirigami live reader</p>
        <h1>Understand long Discourse threads without losing the discussion.</h1>
        <p>
          Kirigami turns a discuss.python.org topic into a guided reading workspace:
          summary, evidence, participant signals, and the original source posts stay connected.
        </p>
        <div className="homeExplainer" aria-label="Project overview">
          <section>
            <h2>What it does</h2>
            <p>
              It fetches a live thread, groups the conversation into readable views, and keeps
              every claim tied back to source posts.
            </p>
          </section>
          <section>
            <h2>Why it exists</h2>
            <p>
              Standards discussions are dense. This helps you see where people align, where
              objections remain, and who shaped the exchange.
            </p>
          </section>
          <section>
            <h2>How to start</h2>
            <p>
              Enter a DPO topic URL or numeric topic ID. The backend collects the posts and opens
              the reader for that exact thread.
            </p>
          </section>
        </div>
        <form className="topicSearchForm" onSubmit={handleSubmit}>
          <label htmlFor="topic-input">
            Topic URL or ID
            <input
              autoComplete="off"
              id="topic-input"
              placeholder="https://discuss.python.org/t/topic-title/12345"
              value={topicInput}
              onChange={(event) => setTopicInput(event.target.value)}
            />
          </label>
          <button disabled={isLoading || !topicInput.trim()} type="submit">
            {isLoading ? "Loading" : "Open reader"}
          </button>
        </form>
        {error ? <p className="errorText">{error}</p> : null}
      </section>
      <section className="topicDiscovery" aria-labelledby="topic-discovery-heading">
        <div className="topicDiscoveryHeader">
          <div>
            <p className="eyebrow">Live DPO feed</p>
            <h2 id="topic-discovery-heading">
              Pick a thread from the current discussion stream.
            </h2>
          </div>
          <button
            className="topicRefreshButton"
            disabled={activeTopicList.isLoading}
            type="button"
            onClick={() => void refreshTopicList(activeList, true)}
          >
            {activeTopicList.isLoading ? "Refreshing" : "Refresh"}
          </button>
        </div>
        <div className="topicListTabs" role="tablist" aria-label="Topic feeds">
          {TOPIC_LIST_TABS.map((tab) => (
            <button
              aria-selected={activeList === tab.kind}
              key={tab.kind}
              role="tab"
              type="button"
              onClick={() => setActiveList(tab.kind)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="topicListPanel" role="tabpanel">
          <div className="topicListPanelMeta">
            <p>{activeTab.deck}</p>
            {activeTopicList.data ? (
              <span>
                Cached until {formatTime(activeTopicList.data.expires_at)}
              </span>
            ) : null}
          </div>
          {activeTopicList.error ? (
            <p className="topicListError">{activeTopicList.error}</p>
          ) : null}
          {activeTopicList.isLoading && !activeTopicList.data ? (
            <p className="topicListStatus">Loading topics...</p>
          ) : (
            <TopicList topics={activeTopicList.data?.topics ?? []} />
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
    return <p className="topicListStatus">No topics returned yet.</p>;
  }

  return (
    <ol className="topicList">
      {topics.map((topic) => (
        <li className="topicListItem" key={topic.topic_id}>
          <div>
            <a className="topicListTitle" href={`/topics/${topic.topic_id}`}>
              {topic.title}
            </a>
            {topic.excerpt ? <p>{topic.excerpt}</p> : null}
          </div>
          <dl className="topicListStats" aria-label={`${topic.title} stats`}>
            <div>
              <dt>Replies</dt>
              <dd>{topic.reply_count}</dd>
            </div>
            <div>
              <dt>Views</dt>
              <dd>{formatNumber(topic.views)}</dd>
            </div>
            <div>
              <dt>Latest</dt>
              <dd>{formatDate(topic.last_posted_at ?? topic.bumped_at)}</dd>
            </div>
            <div>
              <dt>By</dt>
              <dd>{topic.last_poster_username ? `@${topic.last_poster_username}` : "DPO"}</dd>
            </div>
          </dl>
          <div className="topicListActions">
            <a href={`/topics/${topic.topic_id}`}>Open reader</a>
            <a href={topic.url} rel="noreferrer" target="_blank">
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
