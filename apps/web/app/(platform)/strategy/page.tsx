import { Suspense } from "react";

import { AppShell } from "../../../components/navigation/app-shell";
import { StrategyWorkspace } from "../../../components/strategy/strategy-workspace";

export default function StrategyPage() {
  return (
    <AppShell>
      <Suspense fallback={<div style={{ padding: "24px" }}>策略视图加载中...</div>}>
        <StrategyWorkspace />
      </Suspense>
    </AppShell>
  );
}
