"use client";

import { FormEvent, useState } from "react";
import type { DiscussionSummary } from "@/lib/types";

const DEFAULT_API_BASE_URL = "http://localhost:8000";

function clientApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export default function TopicLookup() {
  const [topicId, setTopicId] = useState("");
  const [summary, setSummary] = useState<DiscussionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSummary(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${clientApiBaseUrl()}/api/topics/${encodeURIComponent(topicId)}?limit=4`,
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

      setSummary(payload as DiscussionSummary);
    } catch (lookupError) {
      setError(
        lookupError instanceof Error ? lookupError.message : "Unable to load topic.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="lookupPanel" aria-labelledby="topic-lookup">
      <div className="lookupHeader">
        <div>
          <p className="eyebrow">Live API</p>
          <h2 id="topic-lookup">Topic Lookup</h2>
        </div>
      </div>

      <form className="lookupForm" onSubmit={handleSubmit}>
        <label htmlFor="topic-id">
          Topic ID
          <input
            id="topic-id"
            inputMode="numeric"
            min="1"
            pattern="[0-9]*"
            value={topicId}
            onChange={(event) => setTopicId(event.target.value)}
          />
        </label>
        <button disabled={isLoading || !topicId.trim()} type="submit">
          {isLoading ? "Loading" : "Load"}
        </button>
      </form>

      {error ? <p className="errorText">{error}</p> : null}

      {summary ? (
        <div className="lookupResult" aria-live="polite">
          <strong>{summary.topic.title}</strong>
          <div className="lookupStats">
            <span>{summary.metrics.posts} posts</span>
            <span>{summary.metrics.participants} authors</span>
            <span>{summary.metrics.replies} replies</span>
          </div>
          <p>{summary.posts[0]?.excerpt || "No excerpt available."}</p>
        </div>
      ) : null}
    </section>
  );
}
