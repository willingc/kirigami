"use client";

import { FormEvent, useState } from "react";
import { clientApiBaseUrl } from "@/lib/api";
import type { DiscussionSummary } from "@/lib/types";

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
    <section
      className="border-kiri-hero/15 shadow-kiri-card mx-auto mt-8 grid max-w-[720px] gap-4 rounded-lg border bg-[linear-gradient(180deg,#fbfdfb,#eef5f1)] p-4.5 max-sm:p-2.5"
      aria-labelledby="topic-lookup"
    >
      <div>
        <div>
          <p className="border-kiri-hero/20 bg-kiri-hero/10 text-kiri-hero mb-3 w-fit rounded-full border px-2.5 py-1.5 text-[0.72rem] font-extrabold uppercase">
            Live API
          </p>
          <h2 className="text-[1.55rem] font-black" id="topic-lookup">
            Topic Lookup
          </h2>
        </div>
      </div>

      <form
        className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 max-sm:grid-cols-1"
        onSubmit={handleSubmit}
      >
        <label
          className="text-kiri-ink grid gap-2 text-[0.84rem] font-extrabold"
          htmlFor="topic-id"
        >
          Topic ID
          <input
            className="border-kiri-line bg-kiri-surface text-kiri-ink min-h-12 min-w-0 rounded-lg border px-3.5 outline-0 focus:border-[#f5c06f] focus:shadow-[0_0_0_3px_rgba(245,192,111,0.22)]"
            id="topic-id"
            inputMode="numeric"
            min="1"
            pattern="[0-9]*"
            value={topicId}
            onChange={(event) => setTopicId(event.target.value)}
          />
        </label>
        <button
          className="text-kiri-ink min-h-12 rounded-lg border border-[#f5c06f] bg-[#f5c06f] px-4.5 font-black enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-55"
          disabled={isLoading || !topicId.trim()}
          type="submit"
        >
          {isLoading ? "Loading" : "Load"}
        </button>
      </form>

      {error ? (
        <p className="bg-kiri-contest-soft text-kiri-contest rounded-lg p-4.5 font-extrabold">
          {error}
        </p>
      ) : null}

      {summary ? (
        <div
          className="border-kiri-line grid gap-3 rounded-lg border bg-white/70 p-4"
          aria-live="polite"
        >
          <strong className="text-kiri-hero font-black">{summary.topic.title}</strong>
          <div className="border-kiri-line bg-kiri-line grid grid-cols-3 gap-px overflow-hidden rounded-lg border">
            <span className="bg-kiri-surface text-kiri-muted min-w-0 p-2.5 text-[0.86rem] font-extrabold">
              {summary.metrics.posts} posts
            </span>
            <span className="bg-kiri-surface text-kiri-muted min-w-0 p-2.5 text-[0.86rem] font-extrabold">
              {summary.metrics.participants} authors
            </span>
            <span className="bg-kiri-surface text-kiri-muted min-w-0 p-2.5 text-[0.86rem] font-extrabold">
              {summary.metrics.replies} replies
            </span>
          </div>
          <p>{summary.posts[0]?.excerpt || "No excerpt available."}</p>
        </div>
      ) : null}
    </section>
  );
}
