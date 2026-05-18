export type TopicPost = {
  id: number;
  post_number: number;
  username: string;
  created_at: string;
  updated_at: string;
  raw: string;
  cooked: string;
  reply_count: number;
  quote_count: number;
  reads: number;
  score: number;
  user_title: string | null;
  trust_level: number | null;
};

export type TopicMeta = {
  topicId: number;
  title: string;
  sourceUrl: string;
  dataFile: string;
};

export type SignalCategory = "agreement" | "disagreement" | "question" | "progress";

export type Signal = {
  category: SignalCategory;
  postNumber: number;
  username: string;
  createdAt: string;
  score: number;
  evidence: string;
  matchedTerms: string[];
};

export type Phase = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  postCount: number;
  postStart: number;
  postEnd: number;
  dominantAuthors: string[];
  signalCounts: Record<SignalCategory, number>;
};

export type AuthorSummary = {
  username: string;
  posts: number;
  firstPostAt: string;
  lastPostAt: string;
  reads: number;
  replies: number;
  quotesReceived: number;
  signalCounts: Record<SignalCategory, number>;
};

export type QuoteTarget = {
  postNumber: number;
  username: string;
  count: number;
};

export type ConversationAnalysis = {
  metrics: {
    posts: number;
    participants: number;
    replies: number;
    reads: number;
    quotes: number;
    estimatedReadMinutes: number;
    firstPostAt: string;
    lastPostAt: string;
  };
  authors: AuthorSummary[];
  phases: Phase[];
  signals: Record<SignalCategory, Signal[]>;
  topQuoteTargets: QuoteTarget[];
};
