"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { clientApiBaseUrl } from "@/lib/api";

type ResolvedTopic = {
  topic: {
    topic_id: number;
    title: string;
    url: string;
    posts_count: number;
    last_posted_at: string;
  };
};

export default function TopicSearch() {
  const router = useRouter();
  const [topicInput, setTopicInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    </main>
  );
}
