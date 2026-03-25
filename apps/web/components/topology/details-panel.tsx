import React from "react";

type TopologyFlowEntry = {
  id?: string;
  label?: string;
  protocol?: string;
  port?: number;
  risk?: string;
  source_asset_label?: string;
  destination_asset_label?: string;
  metadata?: Record<string, unknown>;
};

type TopologyNode = {
  id: string;
  label: string;
  type: string;
  risk?: string;
  metadata?: Record<string, unknown>;
  flow_type?: string;
  protocol?: string;
  port?: number;
  source_asset_label?: string;
  destination_asset_label?: string;
  key_flows?: TopologyFlowEntry[];
  key_flow_entries?: TopologyFlowEntry[];
};

type TopologyEdge = {
  id: string;
  from: string;
  to: string;
  type: string;
  label: string;
  source_asset_label?: string;
  destination_asset_label?: string;
  flow_type?: string;
  protocol?: string;
  port?: number;
  risk?: string;
  metadata?: Record<string, unknown>;
  key_flows?: TopologyFlowEntry[];
  key_flow_entries?: TopologyFlowEntry[];
};

export function DetailsPanel({
  node,
  edge,
  nodeLabels
}: {
  node?: TopologyNode;
  edge?: TopologyEdge;
  nodeLabels?: Record<string, string>;
}) {
  const selectedEdge = !node && edge ? edge : undefined;
  const selectedFlowNode = !selectedEdge && node?.type === "flow" ? node : undefined;
  const selectedEdgeEventsLink = selectedEdge ? buildEdgeEventsLink(selectedEdge, nodeLabels) : undefined;
  const flowNodeEventsLink = selectedFlowNode ? buildFlowEventsLink(selectedFlowNode) : undefined;
  const assetEventsLink = !selectedEdge && !selectedFlowNode && node ? buildAssetEventsLink(node) : undefined;
  const selectedMetadata = selectedEdge?.metadata ?? selectedFlowNode?.metadata ?? node?.metadata;
  const selectedKeyFlows = extractKeyFlowEntries(selectedEdge ?? selectedFlowNode);
  const selectedSourceLabel =
    selectedEdge?.source_asset_label ?? (selectedEdge ? nodeLabels?.[selectedEdge.from] ?? selectedEdge.from : undefined);
  const selectedDestinationLabel =
    selectedEdge?.destination_asset_label ??
    (selectedEdge ? nodeLabels?.[selectedEdge.to] ?? selectedEdge.to : undefined);

  return (
    <aside
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 18,
        padding: 18,
        minHeight: 280
      }}
    >
      <h3 style={{ marginTop: 0 }}>{selectedEdge || selectedFlowNode ? "流向详情" : "对象详情"}</h3>
      {selectedEdge ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <strong>名称：</strong>
            {selectedSourceLabel ?? "unknown"} -&gt; {selectedDestinationLabel ?? "unknown"}
          </div>
          {selectedSourceLabel || selectedDestinationLabel ? (
            <div>
              <strong>链路端点：</strong>
              {selectedSourceLabel ?? "unknown"} -&gt; {selectedDestinationLabel ?? "unknown"}
            </div>
          ) : null}
          <div>
            <strong>流向类型：</strong>
            {formatFlowType(selectedEdge.flow_type)}
          </div>
          <div>
            <strong>协议端口：</strong>
            {`${selectedEdge.protocol ?? "tcp"}/${selectedEdge.port ?? 0}`}
          </div>
          <div>
            <strong>标签：</strong>
            {selectedEdge.label}
          </div>
          <div>
            <strong>风险：</strong>
            {selectedEdge.risk ?? "unknown"}
          </div>
          {renderMetadata(selectedMetadata)}
          {renderKeyFlows(selectedKeyFlows)}
          {selectedEdgeEventsLink ? (
            <a
              href={selectedEdgeEventsLink}
              style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
            >
              查看相关事件
            </a>
          ) : null}
        </div>
      ) : selectedFlowNode ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <strong>名称：</strong>
            {selectedFlowNode.label}
          </div>
          <div>
            <strong>流向类型：</strong>
            {formatFlowType(selectedFlowNode.flow_type)}
          </div>
          <div>
            <strong>协议端口：</strong>
            {`${selectedFlowNode.protocol ?? "tcp"}/${selectedFlowNode.port ?? 0}`}
          </div>
          <div>
            <strong>源资产：</strong>
            {selectedFlowNode.source_asset_label ?? "unknown"}
          </div>
          <div>
            <strong>目标资产：</strong>
            {selectedFlowNode.destination_asset_label ?? "unknown"}
          </div>
          <div>
            <strong>风险：</strong>
            {selectedFlowNode.risk ?? "unknown"}
          </div>
          {renderMetadata(selectedMetadata)}
          {renderKeyFlows(selectedKeyFlows)}
          {flowNodeEventsLink ? (
            <a
              href={flowNodeEventsLink}
              style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
            >
              查看相关事件
            </a>
          ) : null}
        </div>
      ) : node ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <strong>名称：</strong>
            {node.label}
          </div>
          <div>
            <strong>类型：</strong>
            {node.type}
          </div>
          <div>
            <strong>风险：</strong>
            {node.risk ?? "unknown"}
          </div>
          {renderMetadata(selectedMetadata)}
          {assetEventsLink ? (
            <a
              href={assetEventsLink}
              style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
            >
              查看相关事件
            </a>
          ) : null}
        </div>
      ) : (
        <p style={{ margin: 0, color: "var(--muted)" }}>点击左侧节点或流向可查看详细信息。</p>
      )}
    </aside>
  );
}

function formatFlowType(value?: string) {
  if (value === "north_south") {
    return "南北向";
  }

  if (value === "east_west") {
    return "东西向";
  }

  if (value === "ops_admin") {
    return "运维";
  }

  return value ?? "unknown";
}

function buildAssetEventsLink(node: TopologyNode) {
  return `/events?search=${encodeURIComponent(node.label)}&targetLabel=${encodeURIComponent(
    node.label
  )}&targetNodeId=${encodeURIComponent(node.id)}`;
}

function buildFlowEventsLink(node: TopologyNode) {
  if (!node.destination_asset_label) {
    return undefined;
  }

  const searchValue = [node.protocol ?? "tcp", node.port ?? 0, node.destination_asset_label].join(" ");
  return `/events?search=${encodeURIComponent(searchValue)}&targetLabel=${encodeURIComponent(
    node.destination_asset_label
  )}&targetNodeId=${encodeURIComponent(node.id)}`;
}

function buildEdgeEventsLink(edge: TopologyEdge, nodeLabels?: Record<string, string>) {
  const destinationLabel = edge.destination_asset_label ?? nodeLabels?.[edge.to];

  if (!destinationLabel) {
    return undefined;
  }

  const searchValue = [edge.protocol ?? "tcp", edge.port ?? 0, destinationLabel].join(" ");
  return `/events?search=${encodeURIComponent(searchValue)}&targetLabel=${encodeURIComponent(
    destinationLabel
  )}&targetEdgeId=${encodeURIComponent(edge.id)}`;
}

function extractKeyFlowEntries(source?: TopologyNode | TopologyEdge) {
  if (!source) {
    return [];
  }

  return source.key_flows ?? source.key_flow_entries ?? [];
}

function renderMetadata(metadata?: Record<string, unknown>) {
  const entries = metadata ? Object.entries(metadata).filter(([, value]) => value !== undefined && value !== null) : [];

  if (!entries.length) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <strong>元数据：</strong>
      <div style={{ display: "grid", gap: 6, paddingLeft: 4 }}>
        {entries.map(([key, value]) => (
          <div key={key}>
            <strong>{formatMetadataKey(key)}：</strong>
            {formatMetadataValue(value)}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderKeyFlows(entries: TopologyFlowEntry[]) {
  if (!entries.length) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <strong>关键流：</strong>
      <div style={{ display: "grid", gap: 8, paddingLeft: 4 }}>
        {entries.map((entry, index) => (
          <div key={entry.id ?? `${entry.label ?? "key-flow"}-${index}`} style={{ display: "grid", gap: 2 }}>
            <div>
              <strong>{entry.label ?? "未命名关键流"}</strong>
            </div>
            <div style={{ color: "var(--muted)" }}>{describeFlowEntry(entry)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function describeFlowEntry(entry: TopologyFlowEntry) {
  const sourceLabel = entry.source_asset_label ?? "unknown";
  const destinationLabel = entry.destination_asset_label ?? "unknown";
  const protocol = entry.protocol ?? "tcp";
  const port = entry.port ?? 0;

  return `${sourceLabel} → ${destinationLabel} · ${protocol}/${port}`;
}

function formatMetadataKey(value: string) {
  return value.replace(/[_-]+/g, " ");
}

function formatMetadataValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(formatMetadataValue).join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return "unknown";
}
