import BrandLogo from "@/components/brand-logo";
import ConversationWorkbench from "@/components/conversation-workbench";
import GitHubLink from "@/components/github-link";
import HowItWorksLink from "@/components/how-it-works-link";
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
      <header className="bg-kiri-surface/85 border-kiri-line/70 shadow-kiri-subtle fixed inset-x-0 top-0 z-50 flex w-full items-center justify-between gap-4 border-b px-[clamp(20px,4vw,64px)] py-3.5 backdrop-blur-md max-sm:px-2.5 max-sm:py-3">
        <BrandLogo />
        <div className="flex shrink-0 items-center gap-2 max-sm:gap-1.5">
          <HowItWorksLink className="text-kiri-ink shadow-kiri-subtle border-[#f5c06f] bg-[#f5c06f] hover:bg-[#ffd180] max-sm:min-h-10 max-sm:px-2.5 max-sm:text-sm" />
          <GitHubLink className="border-kiri-hero/20 bg-kiri-surface/80 text-kiri-hero shadow-kiri-subtle hover:bg-kiri-soft max-sm:min-h-10 max-sm:px-2.5 max-sm:text-sm [&_span]:max-sm:hidden" />
        </div>
      </header>
      <div className="pt-[73px] max-sm:pt-[69px]">
        <ConversationWorkbench
          analysisWarnings={document.analysis_warnings}
          meta={topicMetaFromDocument(document)}
          pepMetadata={document.pep_metadata}
          posts={document.posts}
          roleMatches={document.role_matches}
        />
      </div>
    </>
  );
}
