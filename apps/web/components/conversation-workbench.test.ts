import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

describe("conversation workbench tabs", () => {
  test("uses Thread Radar as the first tab and renames the old view", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./conversation-workbench.tsx", import.meta.url)),
      "utf8",
    );

    expect(source).toContain('{ id: "radar", label: "Thread Radar" }');
    expect(source).toContain('{ id: "evidence", label: "Evidence Map" }');
    expect(source).not.toContain('label: "Dashboard"');
    expect(source).not.toContain(["analyze", "Conversation"].join(""));
    expect(source).toContain("BurnGauge");
    expect(source).toContain("participant_stances");
    expect(source).toContain("Open Discussion");
    expect(source).toContain("Scroll to bottom");
    expect(source).toContain("TopicDiscussionModal");
    expect(source).toContain("SourcePostList");
    expect(source).not.toContain("Open latest");
    expect(source).not.toContain("Latest #");
    expect(source).toContain("Last discussed");
    expect(source).not.toContain("hotness</span>");
    expect(source).not.toContain("hotness_score");
    expect(source).not.toContain("topicsFromIssues");
    expect(source).not.toContain("fallbackBurn");
    expect(source).not.toContain("Fallback from local evidence");
    expect(source).not.toContain("threadAnalysis?:");
  });
});

describe("topic analysis contract", () => {
  test("requires backend thread analysis in the topic document type", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../topic/types.ts", import.meta.url)),
      "utf8",
    );

    expect(source).toContain("thread_analysis: ThreadAnalysis;");
    expect(source).not.toContain("thread_analysis?:");
  });
});
