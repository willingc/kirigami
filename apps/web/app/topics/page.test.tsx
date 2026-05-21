import { describe, expect, test, vi } from "vitest";

vi.mock("./topic-view", () => ({
  default: () => null,
}));

describe("topics page", () => {
  test("is a static page that does not need generateStaticParams", async () => {
    const pageModule = await import("./page");

    expect(pageModule.default).toBeTypeOf("function");
    expect("generateStaticParams" in pageModule).toBe(false);
  });
});
