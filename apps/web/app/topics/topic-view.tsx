"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import BrandLogo from "@/components/brand-logo";
import ConversationWorkbench from "@/components/conversation-workbench";
import GitHubLink from "@/components/github-link";
import HowItWorksLink from "@/components/how-it-works-link";
import { loadTopicDocument, topicMetaFromDocument } from "@/topic/data";
import { topicIdFromSearchParams } from "@/topic/routes";
import type { TopicDocument } from "@/topic/types";

type LoadState =
  | { status: "idle" }
  | { status: "ready"; topicId: string; document: TopicDocument }
  | { status: "error"; topicId: string; message: string };

export default function TopicView() {
  const searchParams = useSearchParams();
  const topicId = useMemo(() => topicIdFromSearchParams(searchParams), [searchParams]);
  const [state, setState] = useState<LoadState>({ status: "idle" });

  useEffect(() => {
    if (!topicId) {
      return;
    }
    let cancelled = false;
    loadTopicDocument(topicId)
      .then((document) => {
        if (!cancelled) setState({ status: "ready", topicId, document });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Failed to load topic";
        setState({ status: "error", topicId, message });
      });
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  const isLoading =
    Boolean(topicId) && (state.status === "idle" || state.topicId !== topicId);
  const errorMessage =
    topicId === null
      ? "No topic ID in URL"
      : state.status === "error" && state.topicId === topicId
        ? state.message
        : null;
  const document =
    state.status === "ready" && state.topicId === topicId ? state.document : null;

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
        {isLoading && <TopicLoadingState />}
        {errorMessage && (
          <div className="text-kiri-ink px-[clamp(20px,4vw,64px)] py-12 text-sm">
            Failed to load topic{topicId ? ` ${topicId}` : ""}: {errorMessage}
          </div>
        )}
        {document && (
          <ConversationWorkbench
            analysisWarnings={document.analysis_warnings}
            conversationAnalysis={document.conversation_analysis}
            meta={topicMetaFromDocument(document)}
            pepMetadata={document.pep_metadata}
            posts={document.posts}
            roleMatches={document.role_matches}
            threadAnalysis={document.thread_analysis}
          />
        )}
      </div>
    </>
  );
}

export function TopicLoadingState() {
  return (
    <div
      className="grid min-h-[calc(100vh-73px)] place-items-center px-[clamp(20px,4vw,64px)] py-12 max-sm:px-2.5"
      role="status"
      aria-label="Preparing topic workspace"
    >
      <div className="border-kiri-hero/15 shadow-kiri-card grid w-full max-w-[760px] gap-5 rounded-lg border bg-[linear-gradient(180deg,#fbfdfb,#eef5f1)] p-5.5 max-sm:p-4">
        <div className="flex items-center gap-4">
          <div className="relative grid h-14 w-14 shrink-0 place-items-center">
            <div className="border-kiri-accent/25 absolute inset-0 animate-spin rounded-lg border-2 border-t-[#f5c06f]" />
            <svg
              aria-hidden="true"
              className="border-kiri-hero/20 bg-kiri-surface shadow-kiri-subtle h-10 w-10 rounded-lg border"
              viewBox="0 0 44 44"
            >
              <rect width="44" height="44" fill="#fbfdfb" />
              <path d="M0 0h44L22 22z" fill="#dff1f8" />
              <path d="M0 0l22 22L0 44z" fill="#0b6ea8" />
              <path d="M44 0v44L22 22z" fill="#f5c06f" />
              <path d="M0 44h44L22 22z" fill="#16322b" />
            </svg>
          </div>
          <div className="grid min-w-0 flex-1 gap-2.5">
            <div className="bg-kiri-hero/18 h-3 w-32 animate-pulse rounded-full" />
            <div className="bg-kiri-line h-2.5 w-full animate-pulse rounded-full" />
            <div className="bg-kiri-line h-2.5 w-4/5 animate-pulse rounded-full" />
          </div>
        </div>
        <div className="border-kiri-line bg-kiri-line grid gap-px overflow-hidden rounded-lg border">
          {[0, 1, 2].map((row) => (
            <div
              className="bg-kiri-surface grid grid-cols-[64px_minmax(0,1fr)] gap-4 p-4 max-sm:grid-cols-1"
              key={row}
            >
              <div className="bg-kiri-accent-soft h-12 w-12 animate-pulse rounded-lg" />
              <div className="grid gap-2.5">
                <div className="bg-kiri-line h-2.5 w-full animate-pulse rounded-full" />
                <div className="bg-kiri-line h-2.5 w-11/12 animate-pulse rounded-full" />
                <div className="bg-kiri-line h-2.5 w-2/3 animate-pulse rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
