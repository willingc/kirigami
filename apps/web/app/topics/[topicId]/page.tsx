import Link from "next/link";
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

  return (
    <>
      <header className="appHeader">
        <Link className="brandLink" href="/">
          Kirigami
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/">New thread</Link>
        </nav>
      </header>
      <ConversationWorkbench meta={topicMetaFromDocument(document)} posts={document.posts} />
    </>
  );
}
