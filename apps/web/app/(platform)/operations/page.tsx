import { Suspense } from "react";

import { OperationsWorkspace } from "../../../components/operations/operations-workspace";

export default function OperationsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "24px" }}>运行态视图加载中...</div>}>
      <OperationsWorkspace />
    </Suspense>
  );
}
