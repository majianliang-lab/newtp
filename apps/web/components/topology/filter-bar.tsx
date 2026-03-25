import React from "react";

export function FilterBar({
  searchValue,
  riskValue,
  flowTypeValue,
  onSearchChange,
  onRiskChange,
  onFlowTypeChange
}: {
  searchValue: string;
  riskValue: string;
  flowTypeValue: string;
  onSearchChange: (value: string) => void;
  onRiskChange: (value: string) => void;
  onFlowTypeChange: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <input
        aria-label="拓扑搜索"
        placeholder="搜索域、资产、设备、端口"
        style={inputStyle}
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <select
        aria-label="风险等级筛选"
        style={inputStyle}
        value={riskValue}
        onChange={(event) => onRiskChange(event.target.value)}
      >
        <option value="all">全部风险等级</option>
        <option value="critical">高危</option>
        <option value="high">较高</option>
        <option value="medium">中等</option>
      </select>
      <select
        aria-label="流向类型筛选"
        style={inputStyle}
        value={flowTypeValue}
        onChange={(event) => onFlowTypeChange(event.target.value)}
      >
        <option value="all">全部流向类型</option>
        <option value="north_south">南北向</option>
        <option value="east_west">东西向</option>
        <option value="ops_admin">运维</option>
      </select>
    </div>
  );
}

const inputStyle = {
  border: "1px solid var(--line)",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  background: "#fff",
  minWidth: 220
} satisfies React.CSSProperties;
