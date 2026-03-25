"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { fetchJson, fetchList } from "../../lib/api";
import { ReplayScenario } from "../topology/replay-panel";

const severityOrder: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  info: 1,
  unknown: 0
};

export function EventsWorkspace() {
  const searchParams = useSearchParams();
  const requestedSearch = searchParams.get("search") ?? "";
  const targetLabel = searchParams.get("targetLabel") ?? "";
  const targetNodeId = searchParams.get("targetNodeId") ?? "";
  const targetEdgeId = searchParams.get("targetEdgeId") ?? "";
  const [workspace, setWorkspace] = useState<EventsWorkspaceModel | null>(null);
  const [collectorStatuses, setCollectorStatuses] = useState<CollectorStatus[]>([]);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      const [liveEvents, nextCollectorStatuses] = await Promise.all([
        fetchList<LiveEvent>("/events/live"),
        fetchJson<CollectorStatus[]>("/collector/statuses").catch(() => [])
      ]);

      if (!active) {
        return;
      }

      setCollectorStatuses(Array.isArray(nextCollectorStatuses) ? nextCollectorStatuses : []);

      if (liveEvents.length > 0) {
        setWorkspace(buildLiveWorkspace(liveEvents));
        return;
      }

      const replay = await fetchJson<ReplayScenario>("/simulation/replay/smb-445");

      if (!active || !replay) {
        return;
      }

      setWorkspace(buildReplayWorkspace(replay));
    }

    void loadWorkspace();

    return () => {
      active = false;
    };
  }, []);

  const rankedEvents = useMemo(() => {
    if (!workspace) {
      return [];
    }

    return [...workspace.events].sort((left, right) => {
      const leftSeverity = severityOrder[String(left.severity ?? "unknown")] ?? 0;
      const rightSeverity = severityOrder[String(right.severity ?? "unknown")] ?? 0;
      return rightSeverity - leftSeverity;
    });
  }, [workspace]);

  const filteredEvents = useMemo(() => {
    if (!rankedEvents.length) {
      return [];
    }

    const searchTokens = requestedSearch
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (!searchTokens.length && !targetLabel && !targetNodeId && !targetEdgeId) {
      return rankedEvents;
    }

    const hasExactEdgeMatch = Boolean(
      targetEdgeId && rankedEvents.some((event) => event.target_edge_id === targetEdgeId)
    );
    const hasExactNodeMatch = Boolean(
      targetNodeId &&
        rankedEvents.some(
          (event) =>
            event.target_asset_node_id === targetNodeId || event.target_flow_node_id === targetNodeId
        )
    );

    return rankedEvents.filter((event) => {
      const matchesExactEdge = !hasExactEdgeMatch || event.target_edge_id === targetEdgeId;
      const matchesExactNode =
        !hasExactNodeMatch ||
        event.target_asset_node_id === targetNodeId ||
        event.target_flow_node_id === targetNodeId;
      const searchText = buildEventSearchText(event);
      const matchesSearch = searchTokens.every((token) => searchText.includes(token));
      const matchesTarget =
        !targetLabel ||
        [event.destination_ip, event.host_ip, event.source_ip]
          .filter((value): value is string => Boolean(value))
          .some((value) => value === targetLabel);

      return matchesExactEdge && matchesExactNode && matchesSearch && matchesTarget;
    });
  }, [rankedEvents, requestedSearch, targetEdgeId, targetLabel, targetNodeId]);

  const displayedEvents =
    requestedSearch || targetLabel || targetNodeId || targetEdgeId
      ? filteredEvents
      : rankedEvents;

  const focusEvent = useMemo(() => {
    if (!displayedEvents.length) {
      return undefined;
    }

    if (targetEdgeId) {
      const matchedEdge = displayedEvents.find((event) => event.target_edge_id === targetEdgeId);

      if (matchedEdge) {
        return matchedEdge;
      }
    }

    if (targetNodeId) {
      const matchedNode = displayedEvents.find(
        (event) =>
          event.target_asset_node_id === targetNodeId || event.target_flow_node_id === targetNodeId
      );

      if (matchedNode) {
        return matchedNode;
      }
    }

    if (targetLabel) {
      const matchedTarget = displayedEvents.find((event) =>
        [event.destination_ip, event.host_ip, event.source_ip].some((value) => value === targetLabel)
      );

      if (matchedTarget) {
        return matchedTarget;
      }
    }

    return displayedEvents[0];
  }, [displayedEvents, targetEdgeId, targetLabel, targetNodeId]);

  const displayedEventTypeCounts = useMemo(() => {
    return displayedEvents.reduce<Record<string, number>>((counts, event) => {
      counts[event.event_type] = (counts[event.event_type] ?? 0) + 1;
      return counts;
    }, {});
  }, [displayedEvents]);

  const displayedImpactedAssets = useMemo(() => {
    const inferredAssets = Array.from(
      new Set(
        displayedEvents
          .flatMap((event) => [event.destination_ip, event.host_ip, event.source_ip])
          .filter((value): value is string => Boolean(value))
      )
    );

    return inferredAssets.length ? inferredAssets : workspace?.impactedAssets ?? [];
  }, [displayedEvents, workspace?.impactedAssets]);

  const primaryCollectorStatus = collectorStatuses[0] ?? null;
  const onlineCollectorCount = collectorStatuses.filter((status) => status.online).length;

  if (!workspace) {
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
          事件流加载中...
        </div>
      </section>
    );
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
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
            <div>
              <h2 style={{ margin: 0 }}>监控与事件工作台</h2>
              <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                聚焦安全设备事件、策略变更、IPS/AV 告警和高优先处置线索。
              </p>
            </div>
            <div
              style={{
                borderRadius: 999,
                padding: "8px 12px",
                background: "var(--accent-soft)",
                color: "var(--accent)",
                fontWeight: 800
              }}
            >
              {workspace.scenarioId}
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <IndicatorCard label="事件总数" value={`${displayedEvents.length} 条`} />
            <IndicatorCard label="高优先事件" value={`${countPriorityEvents(displayedEvents)} 条`} />
            <IndicatorCard label="策略变更" value={`${workspace.stats.policyChangeCount} 次`} />
            <IndicatorCard label="误杀候选" value={`${workspace.stats.falsePositiveCandidates} 条`} />
          </div>

          {primaryCollectorStatus ? (
            <section
              style={{
                background: primaryCollectorStatus.online
                  ? "linear-gradient(180deg, #f6fbf8 0%, #eef8f2 100%)"
                  : "linear-gradient(180deg, #fff8f6 0%, #fff1ee 100%)",
                border: `1px solid ${primaryCollectorStatus.online ? "#c7e8d1" : "#f4c7bf"}`,
                borderRadius: 18,
                padding: 18
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <strong>{primaryCollectorStatus.collector_id}</strong>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {onlineCollectorCount}/{collectorStatuses.length} 在线
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    监听 {primaryCollectorStatus.host}:{primaryCollectorStatus.port}，转发到 {primaryCollectorStatus.api_ingest_url}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    心跳间隔 {primaryCollectorStatus.heartbeat_interval_seconds} 秒
                  </div>
                </div>
                <span
                  style={{
                    borderRadius: 999,
                    padding: "6px 12px",
                    background: primaryCollectorStatus.online ? "rgba(20, 122, 77, 0.12)" : "rgba(180, 35, 24, 0.1)",
                    color: primaryCollectorStatus.online ? "#147a4d" : "#b42318",
                    fontWeight: 800
                  }}
                >
                  {primaryCollectorStatus.online ? "在线" : "离线"}
                </span>
              </div>

              {collectorStatuses.length > 1 ? (
                <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                  {collectorStatuses.slice(1).map((status) => (
                    <div
                      key={status.collector_id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: 12,
                        borderRadius: 14,
                        background: "#fff",
                        border: `1px solid ${status.online ? "#c7e8d1" : "#f4c7bf"}`
                      }}
                    >
                      <div style={{ display: "grid", gap: 4 }}>
                        <strong>{status.collector_id}</strong>
                        <div style={{ color: "var(--muted)", fontSize: 13 }}>
                          {status.host}:{status.port}
                        </div>
                      </div>
                      <span
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          background: status.online ? "rgba(20, 122, 77, 0.12)" : "rgba(180, 35, 24, 0.1)",
                          color: status.online ? "#147a4d" : "#b42318",
                          fontWeight: 700,
                          fontSize: 12
                        }}
                      >
                        {status.online ? "在线" : "离线"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16 }}>
            <section
              style={{
                background: "linear-gradient(180deg, #f7fbff 0%, #eef6ff 100%)",
                border: "1px solid var(--line)",
                borderRadius: 18,
                padding: 18
              }}
            >
              <h3 style={{ marginTop: 0 }}>高优先事件流</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {displayedEvents.map((event, index) => {
                  const isFocusEvent = focusEvent === event;

                  return (
                  <article
                    key={`${event.event_type}-${event.device_id}-${index}`}
                    style={{
                      background: "#fff",
                      border: isFocusEvent ? "1px solid var(--accent)" : "1px solid var(--line)",
                      borderRadius: 14,
                      padding: 14,
                      boxShadow: isFocusEvent ? "0 0 0 2px rgba(28, 100, 242, 0.12)" : "none"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ display: "grid", gap: 6 }}>
                        <strong>{event.event_type}</strong>
                        {isFocusEvent ? (
                          <span
                            style={{
                              width: "fit-content",
                              borderRadius: 999,
                              padding: "4px 10px",
                              background: "var(--accent-soft)",
                              color: "var(--accent)",
                              fontWeight: 800,
                              fontSize: 12
                            }}
                          >
                            定位命中
                          </span>
                        ) : null}
                      </div>
                      <span
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          background: severityTone(String(event.severity ?? "unknown")).background,
                          color: severityTone(String(event.severity ?? "unknown")).color,
                          fontWeight: 700,
                          fontSize: 12
                        }}
                      >
                        {String(event.severity ?? "unknown")}
                      </span>
                    </div>
                    <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13, display: "flex", gap: 4 }}>
                      <span>设备：</span>
                      <span>{event.device_id}</span>
                    </div>
                    {event.destination_ip ? (
                      <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                        目标：{event.destination_ip}
                        {event.destination_port ? `:${event.destination_port}` : ""}
                      </div>
                    ) : null}
                    {event.protocol || event.destination_port ? (
                      <div style={{ marginTop: 10 }}>
                        <a
                          href={buildFlowTopologyLink(event, targetNodeId, targetEdgeId)}
                          aria-label={`查看关联流向 ${event.event_type}`}
                          style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
                        >
                          查看关联流向
                        </a>
                      </div>
                    ) : null}
                  </article>
                  );
                })}
              </div>
            </section>

            <div style={{ display: "grid", gap: 16 }}>
              <section
                style={{
                  background: "linear-gradient(180deg, #fff8f6 0%, #fff1ee 100%)",
                  border: "1px solid #f4c7bf",
                  borderRadius: 18,
                  padding: 18
                }}
              >
                <h3 style={{ marginTop: 0 }}>事件类型分布</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {Object.entries(displayedEventTypeCounts).map(([eventType, count]) => (
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
              </section>

              <section
                style={{
                  background: "#fff",
                  border: "1px solid var(--line)",
                  borderRadius: 18,
                  padding: 18
                }}
              >
                <h3 style={{ marginTop: 0 }}>受影响资产</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {displayedImpactedAssets.map((asset) => (
                    <a
                      key={asset}
                      href={buildTopologyLink(asset, {
                        targetLabel,
                        targetNodeId,
                        targetEdgeId,
                        matchingEvent: displayedEvents.find((event) =>
                          [event.destination_ip, event.host_ip, event.source_ip].includes(asset)
                        )
                      })}
                      aria-label={`定位到拓扑 ${asset}`}
                      style={{ borderRadius: 14, padding: 12, background: "#f8fafc", border: "1px solid var(--line)" }}
                    >
                      {asset}
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type LiveEvent = {
  event_type: string;
  device_id: string;
  severity?: string | number;
  source_ip?: string;
  destination_ip?: string;
  host_ip?: string;
  protocol?: string;
  destination_port?: string | number;
  action?: string;
  target_asset_node_id?: string;
  target_flow_node_id?: string;
  target_edge_id?: string;
};

type CollectorStatus = {
  collector_id: string;
  host: string;
  port: number;
  api_ingest_url: string;
  heartbeat_interval_seconds: number;
  online: boolean;
  last_seen_at: string;
};

type EventsWorkspaceModel = {
  scenarioId: string;
  events: LiveEvent[];
  eventTypeCounts: Record<string, number>;
  impactedAssets: string[];
  stats: {
    policyChangeCount: number;
    falsePositiveCandidates: number;
  };
};

function buildReplayWorkspace(replay: ReplayScenario): EventsWorkspaceModel {
  return {
    scenarioId: replay.scenario_id,
    events: replay.events,
    eventTypeCounts: replay.event_type_counts,
    impactedAssets: replay.evidence.impacted_assets,
    stats: {
      policyChangeCount: replay.stats.policy_change_count,
      falsePositiveCandidates: replay.stats.false_positive_candidates
    }
  };
}

function buildLiveWorkspace(events: LiveEvent[]): EventsWorkspaceModel {
  const impactedAssets = Array.from(
    new Set(
      events
        .flatMap((event) => [event.destination_ip, event.host_ip, event.source_ip])
        .filter((value): value is string => Boolean(value))
    )
  );

  const eventTypeCounts = events.reduce<Record<string, number>>((counts, event) => {
    counts[event.event_type] = (counts[event.event_type] ?? 0) + 1;
    return counts;
  }, {});

  return {
    scenarioId: "live-event-stream",
    events,
    eventTypeCounts,
    impactedAssets,
    stats: {
      policyChangeCount: events.filter((event) => event.event_type === "policy_change").length,
      falsePositiveCandidates: 0
    }
  };
}

function buildTopologyLink(
  asset: string,
  focusContext?: {
    targetLabel?: string;
    targetNodeId?: string;
    targetEdgeId?: string;
    matchingEvent?: LiveEvent;
  }
) {
  const params = [
    ["view", "asset-view"],
    ["search", asset],
    ["targetType", "asset"],
    ["targetLabel", asset]
  ];

  if (
    focusContext?.targetNodeId &&
    focusContext.targetNodeId.startsWith("asset-") &&
    focusContext.targetLabel === asset
  ) {
    params.push(["targetNodeId", focusContext.targetNodeId]);
  } else if (focusContext?.matchingEvent?.target_asset_node_id) {
    params.push(["targetNodeId", focusContext.matchingEvent.target_asset_node_id]);
  }

  if (focusContext?.targetEdgeId && focusContext.targetLabel === asset) {
    params.push(["targetEdgeId", focusContext.targetEdgeId]);
  } else if (focusContext?.matchingEvent?.target_edge_id) {
    params.push(["targetEdgeId", focusContext.matchingEvent.target_edge_id]);
  }

  return `/topology?${params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&")}`;
}

function buildFlowTopologyLink(event: LiveEvent, targetNodeId?: string, targetEdgeId?: string) {
  const searchTokens = [event.protocol ?? "tcp", event.destination_port]
    .concat(event.destination_ip ? [event.destination_ip] : [])
    .filter((value): value is string | number => value !== undefined && value !== null && value !== "")
    .map((value) => String(value));

  const params = [
    ["view", "flow-view"],
    ["search", searchTokens.join(" ")],
    ["targetType", "flow"],
    ["targetProtocol", String(event.protocol ?? "tcp")],
    ["targetPort", String(event.destination_port ?? "")]
  ];

  if (event.destination_ip) {
    params.push(["targetDestination", event.destination_ip]);
  }

  if (targetNodeId?.startsWith("flow-node-")) {
    params.push(["targetNodeId", targetNodeId]);
  } else if (event.target_flow_node_id) {
    params.push(["targetNodeId", event.target_flow_node_id]);
  }

  if (targetEdgeId?.startsWith("flow-")) {
    params.push(["targetEdgeId", targetEdgeId]);
  } else if (event.target_edge_id) {
    params.push(["targetEdgeId", event.target_edge_id]);
  }

  return `/topology?${params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&")}`;
}

function buildEventSearchText(event: LiveEvent) {
  return [
    event.event_type,
    event.device_id,
    event.source_ip ?? "",
    event.destination_ip ?? "",
    event.host_ip ?? "",
    event.protocol ?? "",
    event.destination_port ? String(event.destination_port) : "",
    event.action ?? ""
  ]
    .join(" ")
    .toLowerCase();
}

function IndicatorCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, #f8fbff 0%, #eef5fb 100%)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: 16
      }}
    >
      <div style={{ fontSize: 13, color: "var(--muted)" }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function countPriorityEvents(
  events: Array<{ severity?: string | number }>
) {
  return events.filter((event) => {
    const rank = severityOrder[String(event.severity ?? "unknown")] ?? 0;
    return rank >= 3;
  }).length;
}

function severityTone(severity: string) {
  if (severity === "critical") {
    return { background: "rgba(180, 35, 24, 0.1)", color: "#b42318" };
  }

  if (severity === "high") {
    return { background: "rgba(217, 119, 6, 0.12)", color: "#b45309" };
  }

  if (severity === "medium") {
    return { background: "rgba(11, 99, 206, 0.1)", color: "#0b63ce" };
  }

  return { background: "rgba(15, 118, 110, 0.1)", color: "#0f766e" };
}
