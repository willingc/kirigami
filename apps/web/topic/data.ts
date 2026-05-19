import { fetchApi } from "@/lib/api";
import type { TopicDocument, TopicMeta, TopicPost } from "@/topic/types";

export async function loadTopicDocument(topicId: string): Promise<TopicDocument> {
  const result = await fetchApi<TopicDocument>(
    `/api/topics/${encodeURIComponent(topicId)}/document`,
  );

  if (!result.ok) {
    throw new Error(result.error);
  }

  return {
    ...result.data,
    posts: sortPosts(result.data.posts),
  };
}

export function topicMetaFromDocument(document: TopicDocument): TopicMeta {
  return {
    topicId: document.topic.topic_id,
    title: document.topic.title,
    sourceUrl: document.topic.url,
  };
}

function sortPosts(posts: TopicPost[]): TopicPost[] {
  return [...posts].sort((left, right) => left.post_number - right.post_number);
}
