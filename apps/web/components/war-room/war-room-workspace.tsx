"use client";

import React, { useEffect, useState } from "react";

import { executeSimulationAction, fetchJson } from "../../lib/api";
import { ReplayPanel, ReplayScenario } from "../topology/replay-panel";

type ResponseAction = {
  action_id: string;
  action_type: string;
  title: string;
  description: string;
  target_devices: string[];
  target_entities: string[];
  execution_mode: string;
  priority: string;
  ngtos_intent: string;
  rollback_hint: string;
};

type ResponseActionPlan = {
  scenario_id: string;
  title: string;
  actions: ResponseAction[];
};

type ResponseActionExecutionReceipt = {
  action_id: string;
  status: string;
  executed_device_count: number;
  generated_event_types: string[];
  summary: string;
};

type TopologyNode = {
  id: string;
  label: string;
  type: string;
  protocol?: string;
  port?: number;
  destination_asset_label?: string;
};

type TopologyGraph = {
  nodes: TopologyNode[];
  edges: Array<Record<string, unknown>>;
};

const actionButtonStyle: React.CSSProperties = {
  borderRadius: 999,
  border: "none",
  padding: "10px 14px",
  background: "#0b63ce",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer"
};

export function WarRoomWorkspace() {
  const [replay, setReplay] = useState<ReplayScenario | null>(null);
  const [actionPlan, setActionPlan] = useState<ResponseActionPlan | null>(null);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [executionReceipt, setExecutionReceipt] = useState<ResponseActionExecutionReceipt | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [assetNodeIdByLabel, setAssetNodeIdByLabel] = useState<Record<string, string>>({});
  const [flowNodeIdBySignature, setFlowNodeIdBySignature] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    async function loadReplay() {
      const nextReplay = await fetchJson<ReplayScenario>("/simulation/replay/smb-445");

      if (!active || !nextReplay) {
        return;
      }

       if (needsFallbackTopologyContext(nextReplay)) {
        const [assetGraph, flowGraph] = await Promise.all([
          fetchJson<TopologyGraph>("/topology/asset-view"),
          fetchJson<TopologyGraph>("/topology/flow-view")
        ]);

        if (!active) {
          return;
        }

        if (assetGraph) {
          setAssetNodeIdByLabel(
            Object.fromEntries(assetGraph.nodes.filter((node) => node.type === "asset").map((node) => [node.label, node.id]))
          );
        }

        if (flowGraph) {
          setFlowNodeIdBySignature(
            Object.fromEntries(
              flowGraph.nodes
                .filter((node) => node.type === "flow" && node.destination_asset_label)
                .map((node) => [
                  buildFlowSignature(node.protocol ?? "tcp", node.port ?? 0, node.destination_asset_label ?? ""),
                  node.id
                ])
            )
          );
        }
      }

      setReplay(nextReplay);
    }

    void loadReplay();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadActions() {
      const nextActionPlan = await fetchJson<ResponseActionPlan>("/simulation/actions/smb-445");

      if (!active || !nextActionPlan) {
        return;
      }

      setActionPlan(nextActionPlan);
    }

    void loadActions();

    return () => {
      active = false;
    };
  }, []);

  async function handleExecuteAction(actionId: string) {
    setExecutingActionId(actionId);
    setExecutionError(null);

    try {
      const receipt = (await executeSimulationAction({
        action_id: actionId
      })) as ResponseActionExecutionReceipt;

      setExecutionReceipt(receipt);
    } catch {
      setExecutionReceipt(null);
      setExecutionError("动作执行失败，请稍后重试。");
    } finally {
      setExecutingActionId(null);
    }
  }

  if (!replay) {
    return (
      <section style={{ padding: "24px" }}>
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 20,
            padding: 20
          }}
        >
          护网推演加载中...
        </div>
      </section>
    );
  }

  return (
    <>
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
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
              <div>
                <h2 style={{ margin: 0 }}>应急与护网工作台</h2>
                <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                  聚焦横向传播阻断、策略变更影响、误杀候选和安全事件分布。
                </p>
              </div>
              <div
                style={{
                  borderRadius: 999,
                  padding: "8px 12px",
                  background: "rgba(180, 35, 24, 0.1)",
                  color: "#b42318",
                  fontWeight: 800
                }}
              >
                护网作战模式
              </div>
            </div>

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1.2fr 1fr" }}>
              <div
                style={{
                  background: "linear-gradient(180deg, #fff8f6 0%, #fff1ee 100%)",
                  border: "1px solid #f4c7bf",
                  borderRadius: 18,
                  padding: 18
                }}
              >
                <h3 style={{ marginTop: 0 }}>事件类型分布</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {Object.entries(replay.event_type_counts).map(([eventType, count]) => (
                    <span
                      key={eventType}
                      style={{
                        borderRadius: 999,
                        padding: "10px 14px",
                        background: "#fff",
                        border: "1px solid #f4c7bf",
                        fontWeight: 700
                      }}
                    >
                      {eventType} {count}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: "linear-gradient(180deg, #f7fbff 0%, #eef6ff 100%)",
                  border: "1px solid var(--line)",
                  borderRadius: 18,
                  padding: 18
                }}
              >
                <h3 style={{ marginTop: 0 }}>误杀候选流量</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {replay.evidence.false_positive_candidates.map((item) => (
                    <div
                      key={item.flow_id}
                      style={{ background: "#fff", borderRadius: 14, padding: 12, border: "1px solid var(--line)" }}
                    >
                      <strong>{item.flow_id}</strong>
                      <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                        {item.source_ip} → {item.destination_ip}:{item.port}
                      </div>
                      <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                        <a
                          href={buildFlowTopologyLink(
                            item,
                            item.target_flow_node_id ??
                              flowNodeIdBySignature[
                                buildFlowSignature("tcp", item.port, item.destination_ip)
                              ],
                            item.target_edge_id
                          )}
                          aria-label={`定位误杀流向 ${item.flow_id}`}
                          style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
                        >
                          定位误杀流向
                        </a>
                        <a
                          href={buildRelatedEventsLink(
                            item.destination_ip,
                            item.target_flow_node_id,
                            item.target_edge_id
                          )}
                          aria-label={`查看误杀事件 ${item.flow_id}`}
                          style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
                        >
                          查看误杀事件
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {actionPlan ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--line)",
                  borderRadius: 18,
                  padding: 18
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
                  <div>
                    <h3 style={{ marginTop: 0 }}>{actionPlan.title}</h3>
                    <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                      优先给出可审计、可回滚的天融信 NGTOS 风格处置建议。
                    </p>
                  </div>
                  <div
                    style={{
                      borderRadius: 999,
                      padding: "8px 12px",
                      background: "rgba(11, 99, 206, 0.1)",
                      color: "#0b63ce",
                      fontWeight: 800
                    }}
                  >
                    {actionPlan.actions.length} 个动作
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  {actionPlan.actions.map((action) => {
                    const isExecuting = executingActionId === action.action_id;
                    const isExecuted = executionReceipt?.action_id === action.action_id;

                    return (
                      <article
                        key={action.action_id}
                        style={{
                          borderRadius: 16,
                          border: "1px solid var(--line)",
                          padding: 16,
                          background: "linear-gradient(180deg, #f8fbff 0%, #eef5fb 100%)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                          <div>
                            <h4 style={{ margin: 0 }}>{action.title}</h4>
                            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{action.description}</p>
                          </div>
                          <span
                            style={{
                              borderRadius: 999,
                              padding: "6px 10px",
                              background: "rgba(180, 35, 24, 0.1)",
                              color: "#b42318",
                              fontWeight: 800,
                              fontSize: 12
                            }}
                          >
                            {action.priority}
                          </span>
                        </div>

                        <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
                          <div style={{ color: "var(--muted)", fontSize: 13 }}>目标设备：{action.target_devices.join(", ")}</div>
                          <div style={{ color: "var(--muted)", fontSize: 13 }}>{action.target_devices.join(", ")}</div>
                          <div style={{ color: "var(--muted)", fontSize: 13 }}>
                            执行模式：{action.execution_mode}
                          </div>
                          <div style={{ color: "var(--muted)", fontSize: 13 }}>
                            目标对象：
                            {" "}
                            {action.target_entities.map((entity, index) => {
                              const targetNodeId = assetNodeIdByLabel[entity];

                              if (!targetNodeId) {
                                return (
                                  <React.Fragment key={entity}>
                                    {index > 0 ? ", " : ""}
                                    {entity}
                                  </React.Fragment>
                                );
                              }

                              return (
                                <React.Fragment key={entity}>
                                  {index > 0 ? ", " : ""}
                                  <a
                                    href={`/topology?view=asset-view&search=${encodeURIComponent(entity)}&targetType=asset&targetLabel=${encodeURIComponent(entity)}&targetNodeId=${encodeURIComponent(targetNodeId)}`}
                                    aria-label={`定位处置对象 ${entity}`}
                                    style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
                                  >
                                    {entity}
                                  </a>
                                </React.Fragment>
                              );
                            })}
                          </div>
                          <div
                            style={{
                              background: "#0f172a",
                              color: "#e2e8f0",
                              borderRadius: 14,
                              padding: 14,
                              fontSize: 13,
                              whiteSpace: "pre-wrap",
                              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
                            }}
                          >
                            {action.ngtos_intent}
                          </div>
                          <div style={{ color: "var(--muted)", fontSize: 13 }}>
                            回滚提示：{action.rollback_hint}
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 16 }}>
                          <button
                            type="button"
                            aria-label={`执行动作 ${action.action_id}`}
                            onClick={() => void handleExecuteAction(action.action_id)}
                            disabled={isExecuting}
                            style={{
                              ...actionButtonStyle,
                              opacity: isExecuting ? 0.7 : 1
                            }}
                          >
                            {isExecuting ? "执行中..." : "执行动作"}
                          </button>

                          {isExecuted ? (
                            <div
                              style={{
                                borderRadius: 999,
                                padding: "8px 12px",
                                background: "rgba(18, 183, 106, 0.12)",
                                color: "#027a48",
                                fontWeight: 800
                              }}
                            >
                              已回执
                            </div>
                          ) : null}
                        </div>

                        {isExecuted ? (
                          <div
                            style={{
                              marginTop: 14,
                              borderRadius: 14,
                              padding: 14,
                              border: "1px solid rgba(18, 183, 106, 0.24)",
                              background: "#f3fff8"
                            }}
                          >
                            <div style={{ fontWeight: 800 }}>执行完成</div>
                            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                              {executionReceipt.summary}
                            </div>
                            <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                              生成事件：{executionReceipt.generated_event_types.join(", ")}
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>

                {executionError ? (
                  <div
                    style={{
                      marginTop: 16,
                      borderRadius: 14,
                      padding: 14,
                      border: "1px solid rgba(180, 35, 24, 0.2)",
                      background: "#fff5f3",
                      color: "#b42318",
                      fontWeight: 700
                    }}
                  >
                    {executionError}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <ReplayPanel replay={replay} assetNodeIdByLabel={assetNodeIdByLabel} />
    </>
  );
}

function buildFlowTopologyLink(
  item: ReplayScenario["evidence"]["false_positive_candidates"][number],
  targetNodeId?: string,
  targetEdgeId?: string
) {
  const params = [
    ["view", "flow-view"],
    ["search", `tcp ${item.port} ${item.destination_ip}`],
    ["targetType", "flow"],
    ["targetProtocol", "tcp"],
    ["targetPort", String(item.port)],
    ["targetDestination", item.destination_ip]
  ];

  if (targetNodeId) {
    params.push(["targetNodeId", targetNodeId]);
  }

  if (targetEdgeId) {
    params.push(["targetEdgeId", targetEdgeId]);
  }

  return `/topology?${params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&")}`;
}

function buildRelatedEventsLink(targetLabel: string, targetNodeId?: string, targetEdgeId?: string) {
  const params = [
    ["search", targetLabel],
    ["targetLabel", targetLabel]
  ];

  if (targetNodeId) {
    params.push(["targetNodeId", targetNodeId]);
  }

  if (targetEdgeId) {
    params.push(["targetEdgeId", targetEdgeId]);
  }

  return `/events?${params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&")}`;
}

function buildFlowSignature(protocol: string, port: number, destinationLabel: string) {
  return `${protocol}:${port}:${destinationLabel}`;
}

function needsFallbackTopologyContext(replay: ReplayScenario) {
  const missingAssetTarget = replay.evidence.impacted_assets.some((asset) => {
    const ref = replay.evidence.impacted_asset_refs?.find((item) => item.label === asset);
    return !ref?.target_node_id;
  });

  const missingFlowTarget = replay.evidence.false_positive_candidates.some(
    (item) => !item.target_flow_node_id
  );

  return missingAssetTarget || missingFlowTarget;
}
