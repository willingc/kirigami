import { afterEach, describe, expect, test, vi } from "vitest";

import { loadTopicDocument } from "@/topic/data";

describe("topic document loading", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("rejects a document for a different numeric topic", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          topic: { topic_id: 999 },
          posts: [],
        }),
      })),
    );

    await expect(loadTopicDocument("101676")).rejects.toThrow(
      "API returned topic 999 for requested topic 101676",
    );
  });
});
