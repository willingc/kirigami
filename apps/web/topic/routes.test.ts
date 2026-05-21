import { describe, expect, test } from "vitest";

import { topicHref, topicIdFromSearchParams } from "@/topic/routes";

describe("topic routes", () => {
  test("links through the static topics page", () => {
    expect(topicHref(106196)).toBe("/topics?topicId=106196");
  });

  test("reads topic IDs from query params", () => {
    expect(topicIdFromSearchParams("topicId=106196")).toBe("106196");
  });

  test("encodes topic IDs in generated links", () => {
    expect(topicHref("topic with spaces")).toBe(
      "/topics?topicId=topic%20with%20spaces",
    );
  });

  test("returns null when the query is missing a topic ID", () => {
    expect(topicIdFromSearchParams("")).toBeNull();
  });
});
