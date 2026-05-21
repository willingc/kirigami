export const TOPIC_QUERY_PARAM = "topicId";

type SearchParamsLike = {
  get(name: string): string | null;
};

export function topicHref(topicId: number | string): string {
  return `/topics?${TOPIC_QUERY_PARAM}=${encodeURIComponent(String(topicId))}`;
}

export function topicIdFromSearchParams(
  searchParams?: SearchParamsLike | string | null,
): string | null {
  if (!searchParams) {
    return null;
  }

  const params =
    typeof searchParams === "string" ? new URLSearchParams(searchParams) : searchParams;
  const topicId = params.get(TOPIC_QUERY_PARAM)?.trim();
  return topicId ? topicId : null;
}
