"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import BrandLogo from "@/components/brand-logo";
import ConversationWorkbench from "@/components/conversation-workbench";
import GitHubLink from "@/components/github-link";
import HowItWorksLink from "@/components/how-it-works-link";
import { loadTopicDocument, topicMetaFromDocument } from "@/topic/data";
import type { TopicDocument } from "@/topic/types";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; document: TopicDocument }
  | { status: "error"; message: string };

function topicIdFromPathname(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = pathname.match(/\/topics\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function TopicView() {
  const pathname = usePathname();
  const topicId = useMemo(() => topicIdFromPathname(pathname), [pathname]);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!topicId) {
      setState({ status: "error", message: "No topic ID in URL" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    loadTopicDocument(topicId)
      .then((document) => {
        if (!cancelled) setState({ status: "ready", document });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Failed to load topic";
        setState({ status: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [topicId]);

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
        {state.status === "loading" && (
          <div className="text-kiri-ink/70 px-[clamp(20px,4vw,64px)] py-12 text-sm">
            Loading topic{topicId ? ` ${topicId}` : ""}…
          </div>
        )}
        {state.status === "error" && (
          <div className="text-kiri-ink px-[clamp(20px,4vw,64px)] py-12 text-sm">
            Failed to load topic{topicId ? ` ${topicId}` : ""}: {state.message}
          </div>
        )}
        {state.status === "ready" && (
          <ConversationWorkbench
            analysisWarnings={state.document.analysis_warnings}
            meta={topicMetaFromDocument(state.document)}
            pepMetadata={state.document.pep_metadata}
            posts={state.document.posts}
            roleMatches={state.document.role_matches}
          />
        )}
      </div>
    </>
  );
}
