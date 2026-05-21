import type { TopicPost } from "@/topic/types";

export function postText(post: TopicPost): string {
  return stripHtml(post.cooked || post.raw)
    .replace(/\s+/g, " ")
    .trim();
}

export function cookedHtml(post: TopicPost): string {
  if (post.cooked) {
    return forceBlankLinkTargets(
      enhanceCodeBlocks(absolutizeDiscourseLinks(post.cooked)),
    );
  }

  return `<pre><code>${highlightCode(post.raw)}</code></pre>`;
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function absolutizeDiscourseLinks(html: string): string {
  return html.replace(
    /\b(href|src)=(["'])\//gi,
    (_match, attribute: string, quote: string) =>
      `${attribute}=${quote}https://discuss.python.org/`,
  );
}

function forceBlankLinkTargets(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (_match: string, attributes: string) => {
    return `<a${withSafeBlankLinkAttributes(attributes)}>`;
  });
}

function withSafeBlankLinkAttributes(attributes: string): string {
  return withSafeRel(withBlankTarget(attributes));
}

function withBlankTarget(attributes: string): string {
  if (/\starget\s*=/i.test(attributes)) {
    return attributes.replace(
      /\starget\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i,
      ' target="_blank"',
    );
  }
  return `${attributes} target="_blank"`;
}

function withSafeRel(attributes: string): string {
  if (/\srel\s*=/i.test(attributes)) {
    if (/(\srel\s*=\s*)(["'])(.*?)\2/i.test(attributes)) {
      return attributes.replace(
        /(\srel\s*=\s*)(["'])(.*?)\2/i,
        (_match, prefix: string, quote: string, value: string) =>
          `${prefix}${quote}${safeRelValue(value)}${quote}`,
      );
    }
    return attributes.replace(
      /(\srel\s*=\s*)([^\s>]+)/i,
      (_match, prefix: string, value: string) => `${prefix}${safeRelValue(value)}`,
    );
  }
  return `${attributes} rel="noopener noreferrer"`;
}

function safeRelValue(value: string): string {
  const tokens = value.split(/\s+/).filter(Boolean);
  for (const token of ["noopener", "noreferrer"]) {
    if (!tokens.some((existingToken) => existingToken.toLowerCase() === token)) {
      tokens.push(token);
    }
  }
  return tokens.join(" ");
}

function enhanceCodeBlocks(html: string): string {
  return html.replace(
    /<pre([^>]*)>([\s\S]*?)<\/pre>/gi,
    (match: string, preAttributes: string, content: string) => {
      if (/<(?:ol|ul|li)\b/i.test(content)) {
        return `<pre${preAttributes}><code>${highlightCode(codeListToText(content))}</code></pre>`;
      }

      const codeMatch = content.match(/^<code([^>]*)>([\s\S]*?)<\/code>$/i);
      if (codeMatch) {
        const [, codeAttributes, code] = codeMatch;
        if (/<span\b/i.test(code)) {
          return match;
        }
        return `<pre${preAttributes}><code${codeAttributes}>${highlightCode(unescapeHtml(code))}</code></pre>`;
      }

      if (/<span\b/i.test(content)) {
        return match;
      }

      return `<pre${preAttributes}><code>${highlightCode(stripHtmlPreservingLines(content))}</code></pre>`;
    },
  );
}

function codeListToText(value: string): string {
  return stripHtmlPreservingLines(
    value
      .replace(/<\/li>\s*<li\b[^>]*>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<li\b[^>]*>/gi, "")
      .replace(/<\/?(?:ol|ul)\b[^>]*>/gi, ""),
  );
}

function stripHtmlPreservingLines(value: string): string {
  return unescapeHtml(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n"),
  ).trimEnd();
}

function highlightCode(value: string): string {
  const escaped = escapeHtml(value);
  const placeholders: string[] = [];
  const stash = (html: string) => {
    const token = `\uE000${String.fromCharCode(0xe100 + placeholders.length)}\uE001`;
    placeholders.push(html);
    return token;
  };

  let highlighted = escaped
    .replace(
      /(&quot;(?:\\.|[^&])*?&quot;|&#39;(?:\\.|[^&])*?&#39;|`(?:\\.|[^`])*?`)/g,
      (match) => stash(`<span class="kiri-code-string">${match}</span>`),
    )
    .replace(
      /(^|[\s([{,;])(#.*|\/\/.*|\/\*[\s\S]*?\*\/)($|\n)/gm,
      (_match, prefix: string, comment: string, suffix: string) =>
        `${prefix}${stash(`<span class="kiri-code-comment">${comment}</span>`)}${suffix}`,
    )
    .replace(
      /\b(class|def|return|if|elif|else|for|while|try|except|finally|with|as|import|from|pass|yield|async|await|lambda|static|const|let|var|function|struct|enum|typedef|case|switch|break|continue|public|private|protected|interface|type|None|True|False|null|true|false)\b/g,
      (match) => stash(`<span class="kiri-code-keyword">${match}</span>`),
    )
    .replace(/\b([A-Z][A-Za-z0-9_]*|[A-Za-z_][A-Za-z0-9_]*(?=\())/g, (match) =>
      stash(`<span class="kiri-code-symbol">${match}</span>`),
    )
    .replace(/\b(\d+(?:\.\d+)?)\b/g, (match) =>
      stash(`<span class="kiri-code-number">${match}</span>`),
    );

  placeholders.forEach((placeholder, index) => {
    highlighted = highlighted.replaceAll(
      `\uE000${String.fromCharCode(0xe100 + index)}\uE001`,
      placeholder,
    );
  });
  return highlighted;
}

function unescapeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
