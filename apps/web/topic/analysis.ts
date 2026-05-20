import type {
  AuthorSummary,
  ConversationAnalysis,
  DiscussionIssue,
  Phase,
  PepRoleTag,
  PositionEvent,
  QuoteTarget,
  Signal,
  SignalCategory,
  TopicPost,
} from "@/topic/types";

const WORDS_PER_MINUTE = 220;
const SIGNAL_CATEGORIES: SignalCategory[] = [
  "agreement",
  "disagreement",
  "question",
  "progress",
  "concession",
  "revision",
  "resolution",
];
const GENERIC_ISSUE_TERMS = new Set(["PEP"]);

const KEYWORDS: Record<SignalCategory, string[]> = {
  agreement: [
    "agree",
    "agreed",
    "agreement",
    "consensus",
    "support",
    "sounds good",
    "makes sense",
    "reasonable",
    "yes",
    "+1",
    "no objection",
  ],
  disagreement: [
    "disagree",
    "concern",
    "concerns",
    "objection",
    "object",
    "against",
    "not convinced",
    "problem",
    "issue",
    "risk",
    "worry",
    "blocker",
    "however",
    "but",
  ],
  question: [
    "?",
    "question",
    "clarify",
    "what about",
    "how would",
    "why",
    "can you",
    "could we",
    "does that",
  ],
  progress: [
    "proposal",
    "propose",
    "suggest",
    "next step",
    "update",
    "revised",
    "decided",
    "resolved",
    "compromise",
    "change",
    "remove",
    "drop",
    "accept",
    "conclusion",
  ],
  concession: [
    "changed my mind",
    "i'm convinced",
    "i am convinced",
    "fair point",
    "i was wrong",
    "i now think",
    "i concede",
    "you're right",
    "you are right",
  ],
  revision: [
    "updated the pep",
    "revised the pep",
    "revised the proposal",
    "adjusted the proposal",
    "change the pep",
    "drop this",
    "remove this",
    "narrow the scope",
  ],
  resolution: [
    "accepted",
    "rejected",
    "resolved by",
    "resolution",
    "final decision",
    "pep is final",
    "no longer open",
  ],
};

export function analyzeConversation(posts: TopicPost[]): ConversationAnalysis {
  const textByPost = new Map(posts.map((post) => [post.post_number, postText(post)]));
  const signalTextByPost = new Map(
    posts.map((post) => [post.post_number, proseTextForSignals(post)]),
  );
  const quoteCounts = quotedPostCounts(posts);
  const signals = buildSignals(posts, signalTextByPost);

  return {
    metrics: {
      posts: posts.length,
      participants: new Set(posts.map((post) => post.username)).size,
      replies: posts.reduce((total, post) => total + post.reply_count, 0),
      reads: posts.reduce((total, post) => total + post.reads, 0),
      quotes: posts.reduce((total, post) => total + post.quote_count, 0),
      estimatedReadMinutes: Math.max(
        1,
        Math.round(
          posts.reduce(
            (total, post) => total + wordCount(textByPost.get(post.post_number) ?? ""),
            0,
          ) / WORDS_PER_MINUTE,
        ),
      ),
      firstPostAt: posts[0]?.created_at ?? "",
      lastPostAt: posts.at(-1)?.created_at ?? "",
    },
    authors: buildAuthors(posts, signals, quoteCounts),
    phases: buildPhases(posts, signals),
    signals,
    topQuoteTargets: topQuoteTargets(posts, quoteCounts),
    issues: buildIssues(posts, signals),
    positionEvents: buildPositionEvents(posts, signals),
  };
}

export function postText(post: TopicPost): string {
  return stripHtml(post.cooked || post.raw)
    .replace(/\s+/g, " ")
    .trim();
}

function proseTextForSignals(post: TopicPost): string {
  return stripHtml(
    (post.cooked || post.raw)
      .replace(/<pre[\s\S]*?<\/pre>/gi, " ")
      .replace(/<h[1-6][\s\S]*?<\/h[1-6]>/gi, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function cookedHtml(post: TopicPost): string {
  if (post.cooked) {
    return absolutizeDiscourseLinks(post.cooked);
  }

  return `<pre>${escapeHtml(post.raw)}</pre>`;
}

export function postUrl(sourceUrl: string, postNumber: number): string;
export function postUrl(postNumber: number): string;
export function postUrl(
  sourceUrlOrPostNumber: string | number,
  postNumber?: number,
): string {
  if (typeof sourceUrlOrPostNumber === "string" && typeof postNumber === "number") {
    return `${sourceUrlOrPostNumber.replace(/\/$/, "")}/${postNumber}`;
  }

  const resolvedPostNumber =
    typeof sourceUrlOrPostNumber === "number" ? sourceUrlOrPostNumber : postNumber;
  if (!resolvedPostNumber) {
    return "#source";
  }

  if (typeof window !== "undefined") {
    const topicMatch = window.location.pathname.match(/\/topics\/(\d+)/);
    if (topicMatch?.[1]) {
      return `https://discuss.python.org/t/${topicMatch[1]}/${resolvedPostNumber}`;
    }
  }

  return `#post-${resolvedPostNumber}`;
}

function buildSignals(
  posts: TopicPost[],
  textByPost: Map<number, string>,
): Record<SignalCategory, Signal[]> {
  const signals = emptySignalCounts<Signal[]>(() => []) as Record<
    SignalCategory,
    Signal[]
  >;

  for (const post of posts) {
    const text = textByPost.get(post.post_number) ?? "";
    const lowerText = text.toLowerCase();

    for (const category of SIGNAL_CATEGORIES) {
      const matchedTerms = KEYWORDS[category].filter((term) =>
        lowerText.includes(term),
      );
      if (matchedTerms.length === 0) {
        continue;
      }

      signals[category].push({
        category,
        postNumber: post.post_number,
        username: post.username,
        createdAt: post.created_at,
        score: matchedTerms.length + post.quote_count * 0.25 + post.reply_count * 0.2,
        evidence: excerptAround(text, matchedTerms[0]),
        matchedTerms,
      });
    }
  }

  for (const category of SIGNAL_CATEGORIES) {
    signals[category].sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.postNumber - right.postNumber;
    });
  }

  return signals;
}

function buildAuthors(
  posts: TopicPost[],
  signals: Record<SignalCategory, Signal[]>,
  quoteCounts: Map<number, number>,
): AuthorSummary[] {
  const byAuthor = new Map<string, TopicPost[]>();
  for (const post of posts) {
    byAuthor.set(post.username, [...(byAuthor.get(post.username) ?? []), post]);
  }

  return [...byAuthor.entries()]
    .map(([username, authorPosts]) => {
      const postNumbers = new Set(authorPosts.map((post) => post.post_number));
      return {
        username,
        posts: authorPosts.length,
        firstPostAt: authorPosts[0]?.created_at ?? "",
        lastPostAt: authorPosts.at(-1)?.created_at ?? "",
        reads: authorPosts.reduce((total, post) => total + post.reads, 0),
        replies: authorPosts.reduce((total, post) => total + post.reply_count, 0),
        quotesReceived: authorPosts.reduce(
          (total, post) => total + (quoteCounts.get(post.post_number) ?? 0),
          0,
        ),
        signalCounts: countSignals(signals, postNumbers),
        roles: mergedRoles(authorPosts),
        postNumbers: authorPosts.map((post) => post.post_number),
      };
    })
    .sort(
      (left, right) =>
        right.posts - left.posts || left.username.localeCompare(right.username),
    );
}

function buildIssues(
  posts: TopicPost[],
  signals: Record<SignalCategory, Signal[]>,
): DiscussionIssue[] {
  const postsByNumber = new Map(posts.map((post) => [post.post_number, post]));
  const issueBuckets = new Map<string, Signal[]>();
  for (const category of SIGNAL_CATEGORIES) {
    for (const signal of signals[category]) {
      const key = issueKey(signal);
      issueBuckets.set(key, [...(issueBuckets.get(key) ?? []), signal]);
    }
  }

  return [...issueBuckets.entries()]
    .map(([label, issueSignals], index) => {
      const postNumbers = [
        ...new Set(issueSignals.map((signal) => signal.postNumber)),
      ].sort((left, right) => left - right);
      const issuePosts = postNumbers
        .map((postNumber) => postsByNumber.get(postNumber))
        .filter((post): post is TopicPost => Boolean(post));
      const signalCounts = emptySignalCounts(() => 0);
      for (const signal of issueSignals) {
        signalCounts[signal.category] += 1;
      }
      return {
        id: `issue-${index + 1}`,
        label,
        status: issueStatus(issueSignals, issuePosts),
        confidence: Math.min(1, 0.35 + issueSignals.length * 0.08),
        postNumbers,
        signalCounts,
        roleActivity: mergedRoles(issuePosts),
        lastActivityAt: issuePosts.at(-1)?.created_at ?? "",
      };
    })
    .filter((issue) => issue.postNumbers.length > 0)
    .sort((left, right) => {
      const rightSignals = totalSignals(right.signalCounts);
      const leftSignals = totalSignals(left.signalCounts);
      return rightSignals - leftSignals || left.postNumbers[0] - right.postNumbers[0];
    })
    .slice(0, 8);
}

function buildPositionEvents(
  posts: TopicPost[],
  signals: Record<SignalCategory, Signal[]>,
): PositionEvent[] {
  const postsByNumber = new Map(posts.map((post) => [post.post_number, post]));
  return SIGNAL_CATEGORIES.flatMap((category) =>
    signals[category].map((signal) => {
      const post = postsByNumber.get(signal.postNumber);
      return {
        postNumber: signal.postNumber,
        username: signal.username,
        createdAt: signal.createdAt,
        category,
        evidence: signal.evidence,
        roles: post?.author_roles ?? [],
      };
    }),
  ).sort((left, right) => left.postNumber - right.postNumber);
}

function buildPhases(
  posts: TopicPost[],
  signals: Record<SignalCategory, Signal[]>,
): Phase[] {
  if (posts.length === 0) {
    return [];
  }

  const sorted = [...posts].sort((left, right) => left.post_number - right.post_number);
  const ranges = phaseRanges(sorted);

  return ranges.map(([label, phasePosts], index) => {
    const postNumbers = new Set(phasePosts.map((post) => post.post_number));
    const authorCounts = new Map<string, number>();
    for (const post of phasePosts) {
      authorCounts.set(post.username, (authorCounts.get(post.username) ?? 0) + 1);
    }

    return {
      id: `phase-${index + 1}`,
      label,
      startDate: phasePosts[0]?.created_at ?? "",
      endDate: phasePosts.at(-1)?.created_at ?? "",
      postCount: phasePosts.length,
      postStart: phasePosts[0]?.post_number ?? 0,
      postEnd: phasePosts.at(-1)?.post_number ?? 0,
      dominantAuthors: [...authorCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([username]) => username),
      signalCounts: countSignals(signals, postNumbers),
    };
  });
}

function phaseRanges(posts: TopicPost[]): [string, TopicPost[]][] {
  const firstSegment: TopicPost[] = [];
  const followUp: TopicPost[] = [];
  let previousDate = dayNumber(posts[0]?.created_at ?? "");
  let inFollowUp = false;

  for (const post of posts) {
    const currentDate = dayNumber(post.created_at);
    if (currentDate - previousDate > 14) {
      inFollowUp = true;
    }
    (inFollowUp ? followUp : firstSegment).push(post);
    previousDate = currentDate;
  }

  const firstCut = Math.ceil(firstSegment.length * 0.48);
  const secondCut = Math.ceil(firstSegment.length * 0.78);
  const ranges: [string, TopicPost[]][] = [
    ["Opening burst", firstSegment.slice(0, firstCut)],
    ["Main debate", firstSegment.slice(firstCut, secondCut)],
    ["Slowdown and consolidation", firstSegment.slice(secondCut)],
  ];
  const populatedRanges = ranges.filter(([, range]) => range.length > 0);

  if (followUp.length > 0) {
    populatedRanges.push(["Follow-up", followUp]);
  }

  return populatedRanges;
}

function topQuoteTargets(
  posts: TopicPost[],
  quoteCounts: Map<number, number>,
): QuoteTarget[] {
  const byNumber = new Map(posts.map((post) => [post.post_number, post]));

  return [...quoteCounts.entries()]
    .map(([postNumber, count]) => ({
      postNumber,
      username: byNumber.get(postNumber)?.username ?? "unknown",
      count,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 10);
}

function quotedPostCounts(posts: TopicPost[]): Map<number, number> {
  const counts = new Map<number, number>();

  for (const post of posts) {
    const matches = post.cooked.matchAll(/data-post="(\d+)"/g);
    for (const match of matches) {
      const postNumber = Number(match[1]);
      counts.set(postNumber, (counts.get(postNumber) ?? 0) + 1);
    }
  }

  return counts;
}

function countSignals(
  signals: Record<SignalCategory, Signal[]>,
  postNumbers: Set<number>,
): Record<SignalCategory, number> {
  const counts = emptySignalCounts(() => 0);
  for (const category of SIGNAL_CATEGORIES) {
    counts[category] = signals[category].filter((signal) =>
      postNumbers.has(signal.postNumber),
    ).length;
  }
  return counts;
}

function emptySignalCounts<T>(factory: () => T): Record<SignalCategory, T> {
  return {
    agreement: factory(),
    disagreement: factory(),
    question: factory(),
    progress: factory(),
    concession: factory(),
    revision: factory(),
    resolution: factory(),
  };
}

function issueKey(signal: Signal): string {
  const evidence = cleanedEvidence(signal.evidence);
  const normalized = evidence.toLowerCase();
  const phrase = ISSUE_PHRASES.find(({ terms }) =>
    terms.some((term) => normalized.includes(term)),
  );
  if (phrase) {
    return phrase.label;
  }

  const technicalTerms = evidence
    .match(
      /\b(?:[a-z][a-z0-9_-]*\.(?:json|toml)|[a-z0-9_-]+-[a-z0-9_-]+|[a-z][a-z0-9_-]*_[a-z0-9_-]*|[A-Z]{2,}|PyPI|RISC-V|BLAS|Windows|macOS|Linux)\b/g,
    )
    ?.filter((term) => !GENERIC_ISSUE_TERMS.has(term));
  if (technicalTerms && technicalTerms.length > 0) {
    return [...new Set(technicalTerms)]
      .slice(0, 2)
      .map((term) => humanizeIssueTerm(term))
      .join(" and ");
  }

  return `Discussion around post #${signal.postNumber}`;
}

function issueStatus(signals: Signal[], posts: TopicPost[]): DiscussionIssue["status"] {
  if (signals.length === 0 || posts.length === 0) {
    return "unknown";
  }
  const lastPostTime = new Date(posts.at(-1)?.created_at ?? "").getTime();
  const latestResolution = latestPostNumber(signals, [
    "resolution",
    "revision",
    "concession",
  ]);
  const latestConcern = latestPostNumber(signals, ["disagreement", "question"]);
  if (latestResolution > 0 && latestResolution >= latestConcern) {
    return signals.some(
      (signal) =>
        signal.category === "question" && signal.postNumber > latestResolution,
    )
      ? "work_in_progress"
      : "resolved";
  }
  if (signals.filter((signal) => signal.category === "disagreement").length >= 2) {
    return "in_contention";
  }
  if (Date.now() - lastPostTime > 30 * 24 * 60 * 60 * 1000) {
    return "stale";
  }
  if (signals.length >= 2) {
    return "in_discussion";
  }
  return "unknown";
}

function latestPostNumber(signals: Signal[], categories: SignalCategory[]): number {
  return Math.max(
    0,
    ...signals
      .filter((signal) => categories.includes(signal.category))
      .map((signal) => signal.postNumber),
  );
}

function mergedRoles(posts: TopicPost[]): PepRoleTag[] {
  const byKey = new Map<string, PepRoleTag>();
  for (const post of posts) {
    for (const role of post.author_roles ?? []) {
      byKey.set(`${role.role}:${role.pep_name}`, role);
    }
  }
  return [...byKey.values()].sort((left, right) => left.role.localeCompare(right.role));
}

function totalSignals(counts: Record<SignalCategory, number>): number {
  return SIGNAL_CATEGORIES.reduce((total, category) => total + counts[category], 0);
}

const ISSUE_PHRASES: { label: string; terms: string[] }[] = [
  {
    label: "Variant metadata files",
    terms: ["variant.json", "variants.json", "index-level metadata", "metadata file"],
  },
  {
    label: "Null variant label",
    terms: ["null variant", "null label", "label being used for an empty set"],
  },
  {
    label: "Variant labels and wheel filenames",
    terms: [
      "variant label",
      "wheel filename",
      "filename",
      "path length",
      "windows paths",
    ],
  },
  {
    label: "Variant ordering and selection",
    terms: [
      "variant ordering",
      "ordering/selecting",
      "ordered list",
      "per-package ordering",
    ],
  },
  {
    label: "Multiple indexes and registries",
    terms: [
      "multiple indices",
      "multiple indexes",
      "two registries",
      "registry merging",
      "pypi and piwheels",
    ],
  },
  {
    label: "Lock files and pylock.toml",
    terms: ["pylock.toml", "lockfile", "lock file", "lockfiles"],
  },
  {
    label: "Platform tags versus variants",
    terms: ["platform tags", "platform tag", "variant markers", "environment markers"],
  },
  {
    label: "Variant properties, namespaces, features, and values",
    terms: [
      "variant properties",
      "namespace",
      "feature",
      "compatible values",
      "property mapping",
    ],
  },
  {
    label: "Local builds and future build PEP",
    terms: ["locally-built wheels", "build one", "future pep", "pep 517 build"],
  },
  {
    label: "Package format scope",
    terms: [
      "package format",
      "wheel file itself",
      "split pep 817",
      "series of smaller peps",
    ],
  },
  {
    label: "Validation rules and regular expressions",
    terms: [
      "regex",
      "regular expression",
      "validate",
      "rejected from ever getting uploaded",
    ],
  },
];

function cleanedEvidence(evidence: string): string {
  return evidence
    .replace(/\b[A-Z][\p{L}.'-]+(?:\s+[A-Z][\p{L}.'-]+){0,3}:\s*/gu, "")
    .replace(/\bgithub\.com\/python\/peps\b.*?\bUTC\b/gi, " ")
    .replace(/\bopened\s+\d{1,2}:\d{2}[AP]M\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function humanizeIssueTerm(term: string): string {
  if (term === "PyPI" || term === "BLAS" || term === "RISC-V") {
    return term;
  }
  return term
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function excerptAround(text: string, term: string): string {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const sentences = normalizedText
    .match(/[^.!?]+(?:[.!?]+|$)/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean);

  if (!sentences || sentences.length === 0) {
    return normalizedText;
  }

  const sentenceIndex = sentences.findIndex((sentence) =>
    sentence.toLowerCase().includes(term.toLowerCase()),
  );

  if (sentenceIndex < 0) {
    return leadingSentences(sentences);
  }

  const selected = [sentences[sentenceIndex]];
  if (wordCount(selected.join(" ")) < 24 && sentences[sentenceIndex + 1]) {
    selected.push(sentences[sentenceIndex + 1]);
  }
  if (wordCount(selected.join(" ")) < 24 && sentences[sentenceIndex - 1]) {
    selected.unshift(sentences[sentenceIndex - 1]);
  }

  return selected.join(" ");
}

function leadingSentences(sentences: string[]): string {
  const selected = sentences.slice(0, 2);
  return selected.join(" ");
}

function wordCount(value: string): number {
  return value.split(/\s+/).filter(Boolean).length;
}

function dayNumber(value: string): number {
  const date = new Date(value);
  return Math.floor(date.getTime() / 86_400_000);
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
    /\b(href|src)="\//g,
    (_match, attribute: string) => `${attribute}="https://discuss.python.org/`,
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
