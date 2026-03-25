"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { fetchJson, fetchListCount } from "../../lib/api";

type ReplaySummary = {
  scenario_id: string;
  title: string;
  stats: {
    permit_count: number;
    deny_count: number;
    policy_change_count: number;
    security_event_count: number;
  };
  evidence: {
    impacted_assets: string[];
    ai_summary: string;
  };
};

type Overview = {
  assetCount: number;
  flowCount: number;
  deviceCount: number;
  liveEventCount: number;
  pendingChangeCount: number;
  collectorTotalCount: number;
  collectorOnlineCount: number;
  collectorStatus: {
    collector_id: string;
    host: string;
    port: number;
    api_ingest_url: string;
    heartbeat_interval_seconds: number;
    online: boolean;
    last_seen_at: string;
  } | null;
  collectorStatuses: Array<{
    collector_id: string;
    host: string;
    port: number;
    api_ingest_url: string;
    heartbeat_interval_seconds: number;
    online: boolean;
    last_seen_at: string;
  }>;
  recentChanges: Array<{
    record_id: string;
    source: string;
    title: string;
    status: string;
    related_href: string;
  }>;
  replay: ReplaySummary | null;
};

type DashboardOverview = {
  pending_change_count: number;
  collector_total_count?: number;
  collector_online_count?: number;
  collector_status?: {
    collector_id: string;
    host: string;
    port: number;
    api_ingest_url: string;
    heartbeat_interval_seconds: number;
    online: boolean;
    last_seen_at: string;
  } | null;
  collector_statuses?: Array<{
    collector_id: string;
    host: string;
    port: number;
    api_ingest_url: string;
    heartbeat_interval_seconds: number;
    online: boolean;
    last_seen_at: string;
  }>;
  recent_changes: Array<{
    record_id: string;
    source: string;
    title: string;
    status: string;
    related_href: string;
  }>;
};

const defaultOverview: Overview = {
  assetCount: 0,
  flowCount: 0,
  deviceCount: 0,
  liveEventCount: 0,
  pendingChangeCount: 0,
  collectorTotalCount: 0,
  collectorOnlineCount: 0,
  collectorStatus: null,
  collectorStatuses: [],
  recentChanges: [],
  replay: null
};

export function DashboardWorkspace() {
  const [overview, setOverview] = useState<Overview>(defaultOverview);

  useEffect(() => {
    let active = true;

    async function load() {
      const [assetCount, flowCount, deviceCount, liveEventCount, replay, dashboardOverview] = await Promise.all([
        fetchListCount("/assets"),
        fetchListCount("/flows"),
        fetchListCount("/devices"),
        fetchListCount("/events/live"),
        fetchJson<ReplaySummary>("/simulation/replay/smb-445"),
        fetchJson<DashboardOverview>("/dashboard/overview")
      ]);

      if (!active) {
        return;
      }

      setOverview({
        assetCount,
        flowCount,
        deviceCount,
        liveEventCount,
        pendingChangeCount: dashboardOverview?.pending_change_count ?? 0,
        collectorTotalCount: dashboardOverview?.collector_total_count ?? 0,
        collectorOnlineCount: dashboardOverview?.collector_online_count ?? 0,
        collectorStatus: dashboardOverview?.collector_status ?? null,
        collectorStatuses: dashboardOverview?.collector_statuses ?? [],
        recentChanges: dashboardOverview?.recent_changes ?? [],
        replay
      });
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section style={{ padding: "0 24px 24px" }}>
      <div style={{ display: "grid", gap: 18 }}>
        <section
          style={{
            background: "linear-gradient(135deg, #07172b 0%, #10345d 55%, #1766b1 100%)",
            color: "#fff",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 24px 60px rgba(7, 23, 43, 0.22)"
          }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 13, opacity: 0.76, letterSpacing: 0.4 }}>Platform Overview</div>
            <h2 style={{ margin: 0, fontSize: 32 }}>总驾驶舱</h2>
            <p style={{ margin: 0, maxWidth: 760, color: "rgba(255,255,255,0.82)" }}>
              汇总资产、流向、设备、事件与演练场景，作为整个平台的总览入口和每日值守起点。
            </p>
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: 18 }}>
            <MetricCard label="资产对象" value={`${overview.assetCount} 个`} />
            <MetricCard label="业务流向" value={`${overview.flowCount} 条`} />
            <MetricCard label="安全设备" value={`${overview.deviceCount} 台`} />
            <MetricCard label="实时事件" value={`${overview.liveEventCount} 条`} />
            <MetricCard label="待审批变更" value={`${overview.pendingChangeCount} 条`} />
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
          <Panel title="模块入口">
            <ModuleEntry
              title="资产与业务"
              href="/business"
              summary={`当前已沉淀 ${overview.assetCount} 个资产对象与 ${overview.flowCount} 条业务流向。`}
              action="进入资产与业务"
            />
            <ModuleEntry
              title="策略与设备"
              href="/strategy"
              summary={`当前已纳管 ${overview.deviceCount} 台设备，可继续查看控制点与推策略能力。`}
              action="进入策略与设备"
            />
            <ModuleEntry
              title="运行与接入"
              href="/operations"
              summary={`聚焦 collector 在线状态、设备接入覆盖率和最近运行变更，作为日常巡检入口。`}
              action="进入运行与接入"
            />
            <ModuleEntry
              title="动态拓扑中心"
              href="/topology"
              summary="从安全域、资产和流向三个视角查看结构、风险与定位链路。"
              action="进入动态拓扑"
            />
            <ModuleEntry
              title="AI 编排中心"
              href="/orchestration"
              summary="已支持 445 横向阻断与感染主机隔离两类编排意图的最小闭环。"
              action="进入 AI 编排"
            />
            <ModuleEntry
              title="监控与事件"
              href="/events"
              summary={`当前可优先查看 ${overview.liveEventCount} 条实时标准化事件，并在证据链中继续定位。`}
              action="进入监控与事件"
            />
            <ModuleEntry
              title="应急与护网"
              href="/war-room"
              summary="查看护网回放、误杀候选、推荐动作与处置执行回执。"
              action="进入应急与护网"
            />
            <ModuleEntry
              title="合规与备案"
              href="/compliance"
              summary="从模板化录入入口维护资产、暴露面、账号、流向、设备与控制点。"
              action="进入合规与备案"
            />
            <ModuleEntry
              title="仿真与演练"
              href="/simulation"
              summary="查看演练回放、受影响资产和推荐动作，作为推演结果总入口。"
              action="进入仿真与演练"
            />
          </Panel>

          <Panel title="当前重点场景">
            {overview.replay ? (
              <article style={{ borderRadius: 18, padding: 16, background: "linear-gradient(180deg, #fff8f6 0%, #fff1ee 100%)", border: "1px solid #f4c7bf" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                  <div>
                    <strong style={{ fontSize: 18 }}>{overview.replay.title}</strong>
                    <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>{overview.replay.evidence.ai_summary}</div>
                  </div>
                  <span style={{ borderRadius: 999, padding: "6px 10px", background: "#fff", border: "1px solid #f4c7bf", fontWeight: 700 }}>
                    {overview.replay.scenario_id}
                  </span>
                </div>

                <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginTop: 16 }}>
                  <MiniStat label="允许流量" value={`${overview.replay.stats.permit_count} 条`} />
                  <MiniStat label="阻断流量" value={`${overview.replay.stats.deny_count} 条`} />
                  <MiniStat label="策略变更" value={`${overview.replay.stats.policy_change_count} 次`} />
                  <MiniStat label="安全事件" value={`${overview.replay.stats.security_event_count} 条`} />
                </div>

                <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 13 }}>受影响资产</div>
                <div style={{ marginTop: 4, fontWeight: 700 }}>
                  {overview.replay.evidence.impacted_assets.join(", ") || "暂无"}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                  <ActionLink href="/war-room" label="进入应急与护网" />
                  <ActionLink href="/simulation" label="进入仿真与演练" />
                </div>
              </article>
            ) : (
              <div style={{ color: "var(--muted)" }}>演练场景加载中...</div>
            )}
          </Panel>
        </div>

        <Panel title="数据接入状态">
          {overview.collectorStatus ? (
            <article
              style={{
                borderRadius: 18,
                padding: 18,
                background: "linear-gradient(180deg, #f6fbf8 0%, #eef8f2 100%)",
                border: "1px solid #c7e8d1"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <ActionLink
                    href={buildCollectorHref(overview.collectorStatus.collector_id)}
                    label={overview.collectorStatus.collector_id}
                  />
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    {overview.collectorOnlineCount}/{overview.collectorTotalCount} 在线
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    监听地址 <strong>{overview.collectorStatus.host}:{overview.collectorStatus.port}</strong>
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    转发到 {overview.collectorStatus.api_ingest_url}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    心跳间隔 {overview.collectorStatus.heartbeat_interval_seconds} 秒
                  </div>
                </div>
                <span
                  style={{
                    borderRadius: 999,
                    padding: "6px 12px",
                    background: overview.collectorStatus.online ? "rgba(20, 122, 77, 0.12)" : "rgba(180, 35, 24, 0.1)",
                    color: overview.collectorStatus.online ? "#147a4d" : "#b42318",
                    fontWeight: 800
                  }}
                >
                  {overview.collectorStatus.online ? "在线" : "离线"}
                </span>
              </div>

              {overview.collectorStatuses.length > 1 ? (
                <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                  {overview.collectorStatuses.slice(1).map((status) => (
                    <div
                      key={status.collector_id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: 12,
                        borderRadius: 14,
                        background: "#fff",
                        border: "1px solid #c7e8d1"
                      }}
                    >
                      <div style={{ display: "grid", gap: 4 }}>
                        <ActionLink
                          href={buildCollectorHref(status.collector_id)}
                          label={status.collector_id}
                        />
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

              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <ActionLink href="/events" label="进入监控与事件工作台" />
              </div>
            </article>
          ) : (
            <div style={{ color: "var(--muted)" }}>尚未收到 collector 心跳，当前仍可查看回放与已入库事件。</div>
          )}
        </Panel>

        <Panel title="最近审批与执行">
          {overview.recentChanges.length ? (
            overview.recentChanges.map((record) => (
              <article
                key={record.record_id}
                style={{ borderRadius: 16, padding: 16, background: "#f8fafc", border: "1px solid var(--line)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                  <ActionLink href={buildChangeRecordHref(record)} label={record.title} />
                  <span
                    style={{
                      borderRadius: 999,
                      padding: "4px 10px",
                      background: "rgba(11, 99, 206, 0.1)",
                      color: "#0b63ce",
                      fontWeight: 700,
                      fontSize: 12
                    }}
                  >
                    {record.status}
                  </span>
                </div>
                <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                  来源：{record.source} / 编号：{record.record_id}
                </div>
                <div style={{ marginTop: 12 }}>
                  <ActionLink href={buildChangeRecordHref(record)} label="查看策略审批" />
                </div>
              </article>
            ))
          ) : (
            <div style={{ color: "var(--muted)" }}>暂无审批与执行记录</div>
          )}
        </Panel>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 18, padding: 16 }}>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.76)" }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 20, padding: 18, boxShadow: "0 18px 40px rgba(15, 23, 42, 0.05)" }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div style={{ display: "grid", gap: 12 }}>{children}</div>
    </section>
  );
}

function ModuleEntry({ title, href, summary, action }: { title: string; href: string; summary: string; action: string }) {
  return (
    <article style={{ borderRadius: 16, padding: 16, background: "#f8fafc", border: "1px solid var(--line)" }}>
      <strong>{title}</strong>
      <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>{summary}</div>
      <div style={{ marginTop: 12 }}>
        <ActionLink href={href} label={action} />
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 12, border: "1px solid rgba(244, 199, 191, 0.7)" }}>
      <div style={{ fontSize: 13, color: "var(--muted)" }}>{label}</div>
      <div style={{ marginTop: 6, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "8px 12px",
        background: "rgba(11, 99, 206, 0.1)",
        color: "#0b63ce",
        textDecoration: "none",
        fontWeight: 700,
        fontSize: 13
      }}
    >
      {label}
    </Link>
  );
}

function buildCollectorHref(collectorId: string) {
  return `/operations?collectorId=${encodeURIComponent(collectorId)}`;
}

function buildChangeRecordHref(record: {
  record_id: string;
  related_href: string;
  source: string;
  status: string;
}) {
  if (record.source === "orchestration" || record.status === "pending_approval") {
    return `/strategy?recordId=${encodeURIComponent(record.record_id)}`;
  }

  return record.related_href;
}
