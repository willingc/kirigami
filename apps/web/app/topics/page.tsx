import { Suspense } from "react";

import TopicView from "./topic-view";

export default function TopicPage() {
  return (
    <Suspense>
      <TopicView />
    </Suspense>
  );
}
