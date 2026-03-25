import React, { type ReactNode } from "react";

type ReplayStats = {
  permit_count: number;
  deny_count: number;
  implicit_deny_count: number;
  false_positive_candidates: number;
  policy_change_count: number;
  security_event_count: number;
};

type ReplayEvidenceItem = {
  flow_id: string;
  destination_ip: string;
  source_ip: string;
  policy_id: string;
  port: number;
  target_asset_node_id?: string;
  target_flow_node_id?: string;
  target_edge_id?: string;
};

type ReplayImpactedAssetRef = {
  label: string;
  target_node_id?: string;
};

type ReplayEvidence = {
  impacted_assets: string[];
  impacted_asset_refs?: ReplayImpactedAssetRef[];
  whitelist_exception_hits: ReplayEvidenceItem[];
  false_positive_candidates: ReplayEvidenceItem[];
  ai_summary: string;
};

type ReplayEvent = {
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

export type ReplayScenario = {
  scenario_id: string;
  title: string;
  stats: ReplayStats;
  evidence: ReplayEvidence;
  events: ReplayEvent[];
  event_type_counts: Record<string, number>;
};

export function ReplayPanel({
  replay,
  assetNodeIdByLabel
}: {
  replay: ReplayScenario | null;
  assetNodeIdByLabel?: Record<string, string>;
}) {
  if (!replay) {
    return null;
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
              <h2 style={{ margin: 0 }}>{replay.title}</h2>
              <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{replay.evidence.ai_summary}</p>
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
              {replay.scenario_id}
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <StatCard label="允许流量" value={`${replay.stats.permit_count} 条`} />
            <StatCard label="阻断流量" value={`${replay.stats.deny_count} 条`} />
            <StatCard label="误杀候选" value={`${replay.stats.false_positive_candidates} 条`} />
            <StatCard label="策略变更" value={`${replay.stats.policy_change_count} 次`} />
            <StatCard label="安全事件" value={`${replay.stats.security_event_count} 条`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 16 }}>
            <PanelCard title="受影响资产">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {replay.evidence.impacted_assets.map((asset) => (
                  <a
                    key={asset}
                    href={buildAssetTopologyLink(
                      asset,
                      replay.evidence.impacted_asset_refs?.find((item) => item.label === asset)?.target_node_id ??
                        assetNodeIdByLabel?.[asset]
                    )}
                    aria-label={`定位到拓扑 ${asset}`}
                    style={{
                      borderRadius: 999,
                      padding: "8px 12px",
                      background: "#f8fafc",
                      border: "1px solid var(--line)",
                      fontWeight: 700,
                      color: "inherit",
                      textDecoration: "none"
                    }}
                  >
                    {asset}
                  </a>
                ))}
              </div>
            </PanelCard>

            <PanelCard title="白名单例外">
              <div style={{ display: "grid", gap: 10 }}>
                {replay.evidence.whitelist_exception_hits.map((item) => (
                  <div
                    key={item.flow_id}
                    style={{ background: "#f8fafc", borderRadius: 14, padding: 12, border: "1px solid var(--line)" }}
                  >
                    <strong>{item.policy_id}</strong>
                    <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                      {item.source_ip} → {item.destination_ip}:{item.port}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <a
                        href={buildAssetTopologyLink(item.destination_ip, item.target_asset_node_id)}
                        aria-label={`定位白名单资产 ${item.policy_id}`}
                        style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
                      >
                        定位白名单资产
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </PanelCard>

            <PanelCard title="最近事件">
              <div style={{ display: "grid", gap: 10 }}>
                {replay.events.map((event, index) => (
                  <div
                    key={`${event.event_type}-${event.device_id}-${index}`}
                    style={{ background: "#f8fafc", borderRadius: 14, padding: 12, border: "1px solid var(--line)" }}
                  >
                    <strong>{event.event_type}</strong>
                    <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                      来源设备：{event.device_id}
                    </div>
                    {buildReplayEventLink(event) ? (
                      <div style={{ marginTop: 10 }}>
                        <a
                          href={buildReplayEventLink(event)}
                          aria-label={`查看事件详情 ${event.event_type}`}
                          style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}
                        >
                          查看事件详情
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </PanelCard>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
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
      <div style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
        {label} {value}
      </div>
    </div>
  );
}

function PanelCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: 16
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function buildAssetTopologyLink(asset: string, targetNodeId?: string) {
  const params = [
    ["view", "asset-view"],
    ["search", asset],
    ["targetType", "asset"],
    ["targetLabel", asset]
  ];

  if (targetNodeId) {
    params.push(["targetNodeId", targetNodeId]);
  }

  return `/topology?${params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&")}`;
}

function buildReplayEventLink(event: ReplayEvent) {
  const targetLabel = event.destination_ip || event.host_ip;
  const searchTokens = [event.protocol, event.destination_port]
    .concat(targetLabel ? [targetLabel] : [])
    .filter((value): value is string | number => value !== undefined && value !== null && value !== "")
    .map((value) => String(value));

  if (!targetLabel) {
    return undefined;
  }

  const params = [["search", searchTokens.length ? searchTokens.join(" ") : targetLabel], ["targetLabel", targetLabel]];

  if (event.target_flow_node_id) {
    params.push(["targetNodeId", event.target_flow_node_id]);
  } else if (event.target_asset_node_id) {
    params.push(["targetNodeId", event.target_asset_node_id]);
  }

  if (event.target_edge_id) {
    params.push(["targetEdgeId", event.target_edge_id]);
  }

  return `/events?${params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&")}`;
}
