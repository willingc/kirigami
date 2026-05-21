import { describe, expect, test } from "vitest";

import { cookedHtml } from "@/topic/post-rendering";
import type { TopicPost } from "@/topic/types";

describe("post rendering", () => {
  test("preserves code blocks and adds lightweight syntax spans", () => {
    const html = cookedHtml({
      cooked: "<p>Example:</p><pre><code>def answer():\n    return 42\n</code></pre>",
      raw: "",
    } as TopicPost);

    expect(html).toContain("<pre><code>");
    expect(html).toContain("\n    ");
    expect(html).toContain('class="kiri-code-keyword">def</span>');
    expect(html).toContain('class="kiri-code-number">42</span>');
  });

  test("does not re-highlight code blocks that already contain spans", () => {
    const cooked =
      '<pre><code><span class="hljs-keyword">return</span> value</code></pre>';

    expect(cookedHtml({ cooked, raw: "" } as TopicPost)).toBe(cooked);
  });

  test("opens rendered source-post links in a new tab", () => {
    const html = cookedHtml({
      cooked: '<p><a href="/t/example/1">source</a></p>',
      raw: "",
    } as TopicPost);

    expect(html).toContain('href="https://discuss.python.org/t/example/1"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  test("preserves existing rel tokens while adding blank-link protections", () => {
    const html = cookedHtml({
      cooked: '<p><a href="/t/example/1" rel="nofollow ugc">source</a></p>',
      raw: "",
    } as TopicPost);

    expect(html).toContain('rel="nofollow ugc noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  test("absolutizes single-quoted Discourse links", () => {
    const html = cookedHtml({
      cooked: "<p><a href='/t/example/1'>source</a></p>",
      raw: "",
    } as TopicPost);

    expect(html).toContain("href='https://discuss.python.org/t/example/1'");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  test("converts Discourse extracted-code lists back to code text", () => {
    const html = cookedHtml({
      cooked:
        '<pre><ol class="linenums" start="1" style="counter-reset: item 0"><li>results = {}</li><li>with open(path, "r") as f:</li><li>    return results</li></ol></pre>',
      raw: "",
    } as TopicPost);

    expect(html).toContain("<pre><code>");
    expect(html).not.toContain("<ol");
    expect(html).not.toContain("<li");
    expect(html).not.toContain("counter-reset");
    expect(html).toContain("results = {}");
    expect(html).toContain('class="kiri-code-keyword">with</span>');
    expect(html).toContain('class="kiri-code-symbol">open</span>');
    expect(html).toContain("\n    ");
  });
});
