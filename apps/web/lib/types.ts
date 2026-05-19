export type ApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

export type HealthResponse = {
  status: "ok";
  service: string;
  version: string;
};

export type DiscussionPost = {
  id: number;
  post_number: number;
  username: string;
  created_at: string;
  excerpt: string;
};

export type Participant = {
  username: string;
  posts: number;
};

export type DiscussionSummary = {
  topic: {
    topic_id: number;
    title: string;
    url: string;
    posts_count: number;
    last_posted_at: string;
  };
  metrics: {
    posts: number;
    participants: number;
    replies: number;
    reads: number;
  };
  participants: Participant[];
  posts: DiscussionPost[];
};

export type TopicListItem = {
  topic_id: number;
  title: string;
  slug: string;
  url: string;
  posts_count: number;
  reply_count: number;
  views: number;
  like_count: number;
  created_at: string | null;
  last_posted_at: string | null;
  bumped_at: string | null;
  last_poster_username: string | null;
  excerpt: string;
};

export type TopicListResponse = {
  kind: "recent" | "new";
  limit: number;
  cached: boolean;
  cached_at: string;
  expires_at: string;
  topics: TopicListItem[];
};
