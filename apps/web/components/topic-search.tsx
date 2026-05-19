"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_API_BASE_URL = "http://localhost:8000";

type ResolvedTopic = {
  topic: {
    topic_id: number;
    title: string;
    url: string;
    posts_count: number;
    last_posted_at: string;
  };
};

function clientApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

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
        <h1>Read a Discourse thread without starting from the top.</h1>
        <p>
          Paste a discuss.python.org topic URL or enter a topic ID. Kirigami fetches the
          thread through the backend API and opens the guided reader.
        </p>
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
