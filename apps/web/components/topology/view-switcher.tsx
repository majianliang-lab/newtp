import React from "react";

export type TopologyView = "domain-view" | "asset-view" | "flow-view";

const views: Array<{
  label: string;
  value?: TopologyView;
}> = [
  { label: "安全域视角", value: "domain-view" },
  { label: "业务系统视角" },
  { label: "资产视角", value: "asset-view" },
  { label: "数据流向视角", value: "flow-view" }
];

export function ViewSwitcher({
  activeView = "domain-view",
  onChange = () => undefined
}: {
  activeView?: TopologyView;
  onChange?: (view: TopologyView) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {views.map((view) => (
        <button
          key={view.label}
          type="button"
          onClick={() => {
            if (view.value) {
              onChange(view.value);
            }
          }}
          aria-disabled={view.value ? undefined : true}
          style={{
            border: "1px solid",
            borderColor: view.value === activeView ? "var(--accent)" : "var(--line)",
            background: view.value === activeView ? "var(--accent-soft)" : "#fff",
            color: view.value === activeView ? "var(--accent)" : "var(--text)",
            borderRadius: 999,
            padding: "9px 14px",
            fontWeight: 700,
            cursor: view.value ? "pointer" : "not-allowed",
            opacity: view.value ? 1 : 0.55
          }}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
