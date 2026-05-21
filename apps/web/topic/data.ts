import { fetchApi } from "@/lib/api";
import type { TopicDocument, TopicMeta, TopicPost } from "@/topic/types";

export async function loadTopicDocument(topicId: string): Promise<TopicDocument> {
  const result = await fetchApi<TopicDocument>(
    `/api/topics/${encodeURIComponent(topicId)}/document`,
  );

  if (!result.ok) {
    throw new Error(result.error);
  }

  if (/^\d+$/.test(topicId) && String(result.data.topic?.topic_id ?? "") !== topicId) {
    throw new Error(
      `API returned topic ${result.data.topic?.topic_id ?? "unknown"} for requested topic ${topicId}`,
    );
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
  return [...posts]
    .map((post) => ({
      ...post,
      author_name: post.author_name ?? null,
      reply_to_post_number: post.reply_to_post_number ?? null,
      author_roles: post.author_roles ?? [],
    }))
    .sort((left, right) => left.post_number - right.post_number);
}
