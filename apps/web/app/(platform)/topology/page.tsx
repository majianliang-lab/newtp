import { Suspense } from "react";

import { AppShell } from "../../../components/navigation/app-shell";
import { TopologyWorkspace } from "../../../components/topology/topology-workspace";

export default function TopologyPage() {
  return (
    <AppShell>
      <Suspense fallback={<div style={{ padding: "24px" }}>拓扑视图加载中...</div>}>
        <TopologyWorkspace />
      </Suspense>
    </AppShell>
  );
}
