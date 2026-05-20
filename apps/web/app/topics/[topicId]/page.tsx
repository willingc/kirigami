import TopicView from "./topic-view";

export function generateStaticParams() {
  return [{ topicId: "_" }];
}

export default function TopicPage() {
  return <TopicView />;
}
