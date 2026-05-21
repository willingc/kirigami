import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

describe("topic search feed restore behavior", () => {
  test("refreshes topic feeds after browser back restore instead of showing empty state", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./topic-search.tsx", import.meta.url)),
      "utf8",
    );

    expect(source).toContain('"pageshow"');
    expect(source).toContain('"visibilitychange"');
    expect(source).toContain("refreshMissingOrStaleLists");
    expect(source).toContain("!activeTopicList.data");
    expect(source).toContain("Loading topics...");
    expect(source).not.toContain("activeTopicList.data?.topics ?? []");
  });
});
