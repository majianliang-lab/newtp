import { Suspense } from "react";

import { AppShell } from "../../../components/navigation/app-shell";
import { EventsWorkspace } from "../../../components/events/events-workspace";

export default function EventsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div style={{ padding: "24px" }}>事件视图加载中...</div>}>
        <EventsWorkspace />
      </Suspense>
    </AppShell>
  );
}
