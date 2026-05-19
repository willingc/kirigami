import type {
  AuthorSummary,
  ConversationAnalysis,
  Phase,
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
];

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
};

export function analyzeConversation(posts: TopicPost[]): ConversationAnalysis {
  const textByPost = new Map(posts.map((post) => [post.post_number, postText(post)]));
  const quoteCounts = quotedPostCounts(posts);
  const signals = buildSignals(posts, textByPost);

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
          posts.reduce((total, post) => total + wordCount(textByPost.get(post.post_number) ?? ""), 0) /
            WORDS_PER_MINUTE,
        ),
      ),
      firstPostAt: posts[0]?.created_at ?? "",
      lastPostAt: posts.at(-1)?.created_at ?? "",
    },
    authors: buildAuthors(posts, signals, quoteCounts),
    phases: buildPhases(posts, signals),
    signals,
    topQuoteTargets: topQuoteTargets(posts, quoteCounts),
  };
}

export function postText(post: TopicPost): string {
  return stripHtml(post.cooked || post.raw)
    .replace(/\s+/g, " ")
    .trim();
}

export function cookedHtml(post: TopicPost): string {
  if (post.cooked) {
    return absolutizeDiscourseLinks(post.cooked);
  }

  return `<pre>${escapeHtml(post.raw)}</pre>`;
}

function buildSignals(
  posts: TopicPost[],
  textByPost: Map<number, string>,
): Record<SignalCategory, Signal[]> {
  const signals = emptySignalCounts<Signal[]>(
    () => [],
  ) as Record<SignalCategory, Signal[]>;

  for (const post of posts) {
    const text = textByPost.get(post.post_number) ?? "";
    const lowerText = text.toLowerCase();

    for (const category of SIGNAL_CATEGORIES) {
      const matchedTerms = KEYWORDS[category].filter((term) => lowerText.includes(term));
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
      };
    })
    .sort((left, right) => right.posts - left.posts || left.username.localeCompare(right.username));
}

function buildPhases(posts: TopicPost[], signals: Record<SignalCategory, Signal[]>): Phase[] {
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

function topQuoteTargets(posts: TopicPost[], quoteCounts: Map<number, number>): QuoteTarget[] {
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
    counts[category] = signals[category].filter((signal) => postNumbers.has(signal.postNumber)).length;
  }
  return counts;
}

function emptySignalCounts<T>(factory: () => T): Record<SignalCategory, T> {
  return {
    agreement: factory(),
    disagreement: factory(),
    question: factory(),
    progress: factory(),
  };
}

function excerptAround(text: string, term: string): string {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const sentences = normalizedText.match(/[^.!?]+(?:[.!?]+|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean);

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
