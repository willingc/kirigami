export type TopicPost = {
  id: number;
  post_number: number;
  username: string;
  author_name: string | null;
  created_at: string;
  updated_at: string;
  raw: string;
  cooked: string;
  reply_to_post_number: number | null;
  reply_count: number;
  quote_count: number;
  reads: number;
  score: number;
  user_title: string | null;
  trust_level: number | null;
  author_roles: PepRoleTag[];
};

export type PepPerson = {
  name: string;
  email: string | null;
};

export type PepMetadata = {
  number: number;
  title: string;
  url: string;
  status: string | null;
  type: string | null;
  topic: string | null;
  created: string | null;
  python_version: string | null;
  discussions_to: string | null;
  post_history: string[];
  resolution: string | null;
  authors: PepPerson[];
  sponsors: PepPerson[];
  delegates: PepPerson[];
  fetched_at: string;
};

export type ParticipantProfile = {
  username: string;
  name: string | null;
  user_id: number | null;
  avatar_template: string | null;
  primary_group_name: string | null;
  trust_level: number | null;
  admin: boolean;
  moderator: boolean;
  fetched_at: string | null;
};

export type RoleMatch = {
  pep_name: string;
  role: "author" | "sponsor" | "delegate";
  username: string | null;
  display_name: string | null;
  confidence: number;
  method: string;
  confirmed: boolean;
};

export type PepRoleTag = {
  role: "author" | "sponsor" | "delegate";
  pep_name: string;
  confidence: number;
  method: string;
  confirmed: boolean;
};

export type TopicMeta = {
  topicId: number;
  title: string;
  sourceUrl: string;
};

export type TopicDocument = {
  schema_version: number;
  source: string;
  pep: number | null;
  topic: {
    topic_id: number;
    title: string;
    slug: string;
    url: string;
    posts_count: number;
    last_posted_at: string;
  };
  posts: TopicPost[];
  pep_metadata: PepMetadata | null;
  participants: ParticipantProfile[];
  role_matches: RoleMatch[];
  analysis_warnings: string[];
};

export type SignalCategory =
  | "agreement"
  | "disagreement"
  | "question"
  | "progress"
  | "concession"
  | "revision"
  | "resolution";

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

export type IssueStatus =
  | "resolved"
  | "work_in_progress"
  | "in_contention"
  | "in_discussion"
  | "stale"
  | "unknown";

export type DiscussionIssue = {
  id: string;
  label: string;
  status: IssueStatus;
  confidence: number;
  postNumbers: number[];
  signalCounts: Record<SignalCategory, number>;
  roleActivity: PepRoleTag[];
  lastActivityAt: string;
};

export type PositionEvent = {
  postNumber: number;
  username: string;
  createdAt: string;
  category: SignalCategory;
  evidence: string;
  roles: PepRoleTag[];
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
  roles: PepRoleTag[];
  postNumbers: number[];
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
  issues: DiscussionIssue[];
  positionEvents: PositionEvent[];
};
