import { readFile } from "node:fs/promises";
import path from "node:path";
import type { TopicMeta, TopicPost } from "@/topic/types";

const DATA_FILE = "topic_102383_posts.json";

export const topicMeta: TopicMeta = {
  topicId: 102383,
  title: "Wheel Variants discussion",
  sourceUrl: "https://discuss.python.org/t/102383",
  dataFile: `data/${DATA_FILE}`,
};

export async function loadTopicPosts(): Promise<TopicPost[]> {
  const payload = await readFile(
    path.join(/* turbopackIgnore: true */ process.cwd(), "..", "..", "data", DATA_FILE),
    "utf8",
  );
  const posts = JSON.parse(payload) as TopicPost[];
  return posts.sort((left, right) => left.post_number - right.post_number);
}
