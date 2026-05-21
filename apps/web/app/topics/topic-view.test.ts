import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

describe("topic loading state", () => {
  test("does not render the old topic-id loading copy", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./topic-view.tsx", import.meta.url)),
      "utf8",
    );

    expect(source).not.toContain("Loading topic");
    expect(source).not.toContain("Loading thread");
    expect(source).toContain("Preparing topic workspace");
  });
});
