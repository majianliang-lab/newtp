import { useEffect, useMemo, useState } from "react";

import { DetailsPanel } from "./details-panel";
import { FilterBar } from "./filter-bar";
import { TopologyView, ViewSwitcher } from "./view-switcher";

type GraphNode = {
  id: string;
  type: string;
  label: string;
  risk?: string;
  metadata?: Record<string, unknown>;
  flow_type?: string;
  protocol?: string;
  port?: number;
  source_asset_label?: string;
  destination_asset_label?: string;
  key_flows?: KeyFlowEntry[];
  key_flow_entries?: KeyFlowEntry[];
};

type GraphEdge = {
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
  key_flows?: KeyFlowEntry[];
  key_flow_entries?: KeyFlowEntry[];
};

type KeyFlowEntry = {
  id?: string;
  label?: string;
  protocol?: string;
  port?: number;
  source_asset_label?: string;
  destination_asset_label?: string;
  metadata?: Record<string, unknown>;
};

type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type FocusTarget = {
  type?: "asset" | "flow";
  label?: string;
  protocol?: string;
  port?: number;
  destinationLabel?: string;
  nodeId?: string;
  edgeId?: string;
};

export function TopologyCanvas({
  graph,
  activeView = "domain-view",
  onViewChange = () => undefined,
  initialSearchValue = "",
  focusTarget
}: {
  graph: Graph;
  activeView?: TopologyView;
  onViewChange?: (view: TopologyView) => void;
  initialSearchValue?: string;
  focusTarget?: FocusTarget;
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(graph.nodes[0]?.id);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | undefined>(undefined);
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [riskValue, setRiskValue] = useState("all");
  const [flowTypeValue, setFlowTypeValue] = useState("all");

  const nodeLabels = useMemo(
    () => Object.fromEntries(graph.nodes.map((node) => [node.id, node.label])),
    [graph.nodes]
  );

  const filteredEdges = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return graph.edges.filter((edge) => {
      const matchesRisk = riskValue === "all" || edge.risk === riskValue;
      const matchesFlowType = flowTypeValue === "all" || edge.flow_type === flowTypeValue;
      const searchText = [
        edge.label,
        nodeLabels[edge.from] ?? edge.from,
        nodeLabels[edge.to] ?? edge.to,
        edge.protocol ?? "",
        edge.port ? String(edge.port) : "",
        edge.flow_type ?? "",
        edge.source_asset_label ?? "",
        edge.destination_asset_label ?? "",
        extractKeyFlowSearchText(edge)
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !normalizedSearch || searchText.includes(normalizedSearch);

      return matchesRisk && matchesFlowType && matchesSearch;
    });
  }, [flowTypeValue, graph.edges, nodeLabels, riskValue, searchValue]);

  const filteredNodes = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const matchedNodeIdsByEdges = new Set(filteredEdges.flatMap((edge) => [edge.from, edge.to]));

    return graph.nodes.filter((node) => {
      const matchesRisk = riskValue === "all" || node.risk === riskValue;
      const nodeSearchText = [node.label, node.protocol ?? "", node.port ? String(node.port) : "", node.flow_type ?? ""]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !normalizedSearch || nodeSearchText.includes(normalizedSearch);
      const matchesFlowType =
        flowTypeValue === "all" || matchedNodeIdsByEdges.has(node.id) || node.type === "flow";

      return matchesRisk && matchesSearch && matchesFlowType;
    });
  }, [filteredEdges, flowTypeValue, graph.nodes, riskValue, searchValue]);

  const focusNode = findFocusTargetNode(filteredNodes, focusTarget);
  const focusEdge = findFocusTargetEdge(filteredEdges, focusTarget);
  const selectedEdge = focusEdge ?? filteredEdges.find((edge) => edge.id === selectedEdgeId);
  const selectedNode =
    selectedEdge
      ? undefined
      : focusNode ??
        filteredNodes.find((node) => node.id === selectedNodeId) ??
        (initialSearchValue.trim() ? filteredNodes[0] : undefined);
  const pivotTargetNodeId = focusNode?.id ?? (initialSearchValue.trim() ? filteredNodes[0]?.id : undefined);

  useEffect(() => {
    setSelectedEdgeId(undefined);
    setSelectedNodeId(graph.nodes[0]?.id);
  }, [graph]);

  useEffect(() => {
    setSearchValue(initialSearchValue);
  }, [initialSearchValue]);

  useEffect(() => {
    if (selectedEdgeId && !filteredEdges.some((edge) => edge.id === selectedEdgeId)) {
      setSelectedEdgeId(undefined);
    }
  }, [filteredEdges, selectedEdgeId]);

  useEffect(() => {
    if (selectedEdgeId) {
      return;
    }

    if (selectedNodeId && filteredNodes.some((node) => node.id === selectedNodeId)) {
      return;
    }

    setSelectedNodeId(filteredNodes[0]?.id);
  }, [filteredNodes, selectedEdgeId, selectedNodeId]);

  function handleNodeSelect(nodeId: string) {
    setSelectedEdgeId(undefined);
    setSelectedNodeId(nodeId);
  }

  function handleEdgeSelect(edgeId: string) {
    setSelectedNodeId(undefined);
    setSelectedEdgeId(edgeId);
  }

  return (
    <section style={{ padding: "0 24px 24px" }}>
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.05)"
        }}
      >
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0 }}>动态拓扑中心</h2>
              <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                统一查看安全域、核心业务流向、控制点和异常链路。
              </p>
            </div>
            <ViewSwitcher activeView={activeView} onChange={onViewChange} />
          </div>

          <FilterBar
            searchValue={searchValue}
            riskValue={riskValue}
            flowTypeValue={flowTypeValue}
            onSearchChange={setSearchValue}
            onRiskChange={setRiskValue}
            onFlowTypeChange={setFlowTypeValue}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 16 }}>
            <div
              style={{
                background: "linear-gradient(180deg, #f8fbff 0%, #eef5fb 100%)",
                border: "1px solid var(--line)",
                borderRadius: 18,
                padding: 18
              }}
            >
              <div style={{ display: "grid", gap: 14 }}>
                <div
                  aria-label="拓扑节点"
                  role="region"
                  style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
                >
                  {filteredNodes.length ? (
                    filteredNodes.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const isPivotTarget = pivotTargetNodeId === node.id;

                      return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => handleNodeSelect(node.id)}
                        style={{
                          border: isPivotTarget ? "1px solid var(--accent)" : "1px solid var(--line)",
                          borderRadius: 16,
                          padding: 16,
                          textAlign: "left",
                          background: isSelected ? "var(--accent-soft)" : "#fff",
                          boxShadow: isPivotTarget ? "0 0 0 2px rgba(28, 100, 242, 0.12)" : "none",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>{node.type}</div>
                          {isPivotTarget ? (
                            <span
                              style={{
                                borderRadius: 999,
                                padding: "4px 8px",
                                background: "var(--accent)",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 800
                              }}
                            >
                              定位命中
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{node.label}</div>
                        <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                          风险等级：{node.risk ?? "unknown"}
                        </div>
                      </button>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        padding: 16,
                        borderRadius: 16,
                        background: "#fff",
                        border: "1px dashed var(--line)",
                        color: "var(--muted)"
                      }}
                    >
                      当前筛选条件下暂无匹配节点。
                    </div>
                  )}
                </div>

                <div
                  style={{
                    background: "#fff",
                    border: "1px dashed var(--line)",
                    borderRadius: 16,
                    padding: 16
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>关键流向</h3>
                  <div style={{ display: "grid", gap: 10 }}>
                    {filteredEdges.length ? (
                      filteredEdges.map((edge) => {
                        const fromLabel = nodeLabels[edge.from] ?? edge.from;
                        const toLabel = nodeLabels[edge.to] ?? edge.to;
                        const keyFlows = extractKeyFlowEntries(edge);
                        const edgeLabel = edge.label ?? keyFlows[0]?.label ?? `${fromLabel} → ${toLabel}`;
                        const isSelected = selectedEdge?.id === edge.id;
                        const isPivotFlowHit =
                          focusTarget?.type === "asset" &&
                          pivotTargetNodeId !== undefined &&
                          (edge.from === pivotTargetNodeId || edge.to === pivotTargetNodeId);

                        return (
                          <button
                            key={edge.id}
                            type="button"
                            aria-label={`查看流向 ${fromLabel} 到 ${toLabel}`}
                            onClick={() => handleEdgeSelect(edge.id)}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 16,
                              padding: "12px 14px",
                              borderRadius: 14,
                              background: isSelected || isPivotFlowHit ? "var(--accent-soft)" : "#f8fafc",
                              border: isPivotFlowHit ? "1px solid var(--accent)" : "1px solid var(--line)",
                              cursor: "pointer",
                              textAlign: "left"
                            }}
                            >
                            <span>
                              {fromLabel} → {toLabel}
                              {keyFlows.length ? (
                                <span style={{ display: "block", marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
                                  {keyFlows.map((flow, index) => (
                                    <span key={flow.id ?? `${edge.id}-${index}`}>
                                      {index > 0 ? "，" : ""}
                                      {formatKeyFlowSummary(flow)}
                                    </span>
                                  ))}
                                </span>
                              ) : null}
                            </span>
                            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              {isPivotFlowHit ? (
                                <span
                                  style={{
                                    borderRadius: 999,
                                    padding: "4px 8px",
                                    background: "var(--accent)",
                                    color: "#fff",
                                    fontSize: 11,
                                    fontWeight: 800
                                  }}
                                >
                                  关联命中
                                </span>
                              ) : null}
                              <strong>{edgeLabel}</strong>
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div style={{ color: "var(--muted)" }}>当前筛选条件下暂无匹配流向。</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DetailsPanel node={selectedNode} edge={selectedEdge} nodeLabels={nodeLabels} />
          </div>
        </div>
      </div>
    </section>
  );
}

function findFocusTargetNode(nodes: GraphNode[], focusTarget?: FocusTarget) {
  if (focusTarget?.nodeId) {
    return nodes.find((node) => node.id === focusTarget.nodeId);
  }

  if (!focusTarget?.type) {
    return undefined;
  }

  if (focusTarget.type === "asset" && focusTarget.label) {
    return nodes.find((node) => node.type === "asset" && node.label === focusTarget.label);
  }

  if (focusTarget.type === "flow") {
    return nodes.find(
      (node) =>
        node.type === "flow" &&
        (focusTarget.protocol ? node.protocol === focusTarget.protocol : true) &&
        (focusTarget.port ? node.port === focusTarget.port : true) &&
        (focusTarget.destinationLabel
          ? node.destination_asset_label === focusTarget.destinationLabel
          : true)
    );
  }

  return undefined;
}

function findFocusTargetEdge(edges: GraphEdge[], focusTarget?: FocusTarget) {
  if (!focusTarget?.edgeId) {
    return undefined;
  }

  return edges.find((edge) => edge.id === focusTarget.edgeId);
}

function extractKeyFlowEntries(source?: GraphEdge | GraphNode) {
  if (!source) {
    return [];
  }

  return source.key_flows ?? source.key_flow_entries ?? [];
}

function extractKeyFlowSearchText(edge: GraphEdge) {
  return extractKeyFlowEntries(edge)
    .map((entry) => [entry.label, entry.source_asset_label, entry.destination_asset_label, entry.protocol, entry.port]
      .filter(Boolean)
      .join(" "))
    .join(" ");
}

function formatKeyFlowSummary(entry: KeyFlowEntry) {
  const label = entry.label ?? "未命名关键流";
  const sourceLabel = entry.source_asset_label ?? "unknown";
  const destinationLabel = entry.destination_asset_label ?? "unknown";

  return `${label} ${sourceLabel} → ${destinationLabel}`;
}
