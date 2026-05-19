import ConversationWorkbench from "@/components/conversation-workbench";
import { loadTopicDocument, topicMetaFromDocument } from "@/topic/data";

export const dynamic = "force-dynamic";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const document = await loadTopicDocument(topicId);

  return <ConversationWorkbench meta={topicMetaFromDocument(document)} posts={document.posts} />;
}
