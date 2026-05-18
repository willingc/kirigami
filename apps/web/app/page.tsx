import ConversationWorkbench from "@/components/conversation-workbench";
import { loadTopicPosts, topicMeta } from "@/topic/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await loadTopicPosts();

  return <ConversationWorkbench meta={topicMeta} posts={posts} />;
}
