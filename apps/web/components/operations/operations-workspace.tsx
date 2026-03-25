"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { fetchJson } from "../../lib/api";

type Device = {
  id: number;
  device_name: string;
  vendor: string;
  device_type: string;
  log_ingest_status: string;
  policy_push_capability: boolean;
};

type CollectorStatus = {
  collector_id: string;
  host: string;
  port: number;
  api_ingest_url: string;
  heartbeat_interval_seconds: number;
  last_seen_at: string;
  online: boolean;
};

type LiveEvent = {
  id: number;
  event_type: string;
  severity?: string;
  destination_ip?: string;
};

type ChangeRecord = {
  record_id: string;
  source: string;
  title: string;
  status: string;
  related_href: string;
};

type Diagnostic = {
  category: string;
  title: string;
  summary: string;
  priority: number;
  priority_label: string;
  impact_count: number;
  scope_label: string;
  action_label: string;
  action_href: string;
  targets: Array<{
    label: string;
    href: string;
  }>;
};

type DiagnosticGroup = {
  category: string;
  title: string;
  priority: number;
  priority_label: string;
  items: Diagnostic[];
};

type OperationsOverview = {
  collector_total_count: number;
  collector_online_count: number;
  device_total_count: number;
  connected_device_count: number;
  disconnected_device_count: number;
  log_coverage_rate: number;
  collector_coverage_rate: number;
  live_event_count: number;
  high_risk_event_count: number;
  pending_change_count: number;
  collector_statuses: CollectorStatus[];
  disconnected_devices: Device[];
  recent_events: LiveEvent[];
  recent_changes: ChangeRecord[];
  diagnostics: Diagnostic[];
  diagnostic_groups: DiagnosticGroup[];
  recommended_actions: Diagnostic[];
};

export function OperationsWorkspace() {
  const searchParams = useSearchParams();
  const focusedCollectorId = searchParams.get("collectorId") ?? "";
  const [overview, setOverview] = useState<OperationsOverview | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const nextOverview = await fetchJson<OperationsOverview>("/operations/overview");

      if (!active || !nextOverview) {
        return;
      }

      setOverview(nextOverview);
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  if (!overview) {
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
          运行态加载中...
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: "0 24px 24px" }}>
      <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 20, padding: 20, boxShadow: "0 18px 40px rgba(15, 23, 42, 0.05)" }}>
        <div style={{ display: "grid", gap: 18 }}>
          <div>
            <h2 style={{ margin: 0 }}>运行与接入工作台</h2>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
              汇总 collector、设备接入、实时事件和变更状态，作为平台运行态巡检入口。
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <QuickLink href="/events" label="进入监控与事件" />
              <QuickLink href="/strategy" label="进入策略与设备" />
              <QuickLink href="/compliance" label="补录设备与接入" />
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <MiniCard label="采集器在线" value={`${overview.collector_online_count}/${overview.collector_total_count}`} />
            <MiniCard label="设备接入率" value={`${overview.log_coverage_rate}%`} />
            <MiniCard label="实时事件" value={`${overview.live_event_count} 条`} />
            <MiniCard label="待审批变更" value={`${overview.pending_change_count} 条`} />
            <MiniCard label="采集链健康度" value={`${overview.collector_coverage_rate}%`} />
          </div>

          <Panel title="建议优先动作">
            <div style={{ display: "grid", gap: 10 }}>
              {overview.recommended_actions.map((item) => (
                <article key={`${item.category}-${item.title}`} style={{ borderRadius: 14, padding: 14, background: "#fff8f6", border: "1px solid #f4c7bf" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                    <div>
                      <strong>{item.title}</strong>
                      <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>{item.summary}</div>
                      <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
                        影响 {item.impact_count} 项 / 来源 {item.scope_label}
                      </div>
                      <TargetLinks targets={item.targets} />
                    </div>
                    <PriorityBadge label={item.priority_label} priority={item.priority} />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <QuickLink href={item.action_href} label={item.action_label} />
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 16 }}>
            <Panel title="Collector 实例">
              {overview.collector_statuses.length ? (
                overview.collector_statuses.map((collector) => (
                  <article
                    key={collector.collector_id}
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      background:
                        collector.collector_id === focusedCollectorId
                          ? "#fff5dc"
                          : collector.online
                            ? "#f6fbff"
                            : "#fff8f6",
                      border: `1px solid ${
                        collector.collector_id === focusedCollectorId
                          ? "#e7b416"
                          : collector.online
                            ? "rgba(11, 99, 206, 0.18)"
                            : "#f4c7bf"
                      }`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                      <div>
                        <strong>{collector.collector_id}</strong>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          {collector.host}:{collector.port} / 心跳 {collector.heartbeat_interval_seconds}s
                        </div>
                        <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 13 }}>
                          API: {collector.api_ingest_url}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "end" }}>
                        {collector.collector_id === focusedCollectorId ? (
                          <span
                            style={{
                              borderRadius: 999,
                              padding: "4px 10px",
                              background: "rgba(231, 180, 22, 0.14)",
                              color: "#9a6700",
                              fontWeight: 700,
                              fontSize: 12
                            }}
                          >
                            定位命中
                          </span>
                        ) : null}
                        <Badge tone={collector.online ? "info" : "danger"}>
                          {collector.online ? "在线" : "离线"}
                        </Badge>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div style={{ color: "var(--muted)" }}>当前尚未收到 collector 心跳。</div>
              )}
            </Panel>

            <Panel title="接入归因摘要">
              <div style={{ display: "grid", gap: 10 }}>
                {overview.diagnostic_groups.length
                  ? overview.diagnostic_groups.map((group) => (
                      <article key={group.category} style={{ borderRadius: 14, padding: 14, background: "#f8fafc", border: "1px solid var(--line)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                          <strong>{group.title}</strong>
                          <PriorityBadge label={group.priority_label} priority={group.priority} />
                        </div>
                        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                          {group.items.map((item) => (
                            <div key={item.title} style={{ borderRadius: 12, padding: 12, background: "#fff", border: "1px solid var(--line)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                                <div style={{ fontWeight: 700 }}>{item.title}</div>
                                <PriorityBadge label={item.priority_label} priority={item.priority} />
                              </div>
                              <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>{item.summary}</div>
                              <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
                                影响 {item.impact_count} 项 / 来源 {item.scope_label}
                              </div>
                              <TargetLinks targets={item.targets} />
                              <div style={{ marginTop: 10 }}>
                                <QuickLink href={item.action_href} label={item.action_label} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))
                  : overview.diagnostics.map((item) => (
                      <article key={item.title} style={{ borderRadius: 14, padding: 14, background: "#f8fafc", border: "1px solid var(--line)" }}>
                        <strong>{item.title}</strong>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>{item.summary}</div>
                        <div style={{ marginTop: 10 }}>
                          <QuickLink href={item.action_href} label={item.action_label} />
                        </div>
                      </article>
                    ))}
              </div>
            </Panel>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Panel title="未接入设备">
              {overview.disconnected_devices.length ? (
                overview.disconnected_devices.map((device) => (
                  <Row
                    key={device.id}
                    title={device.device_name}
                    subtitle={`${device.vendor} / ${device.device_type} / ${device.log_ingest_status}`}
                    href={`/events?search=${encodeURIComponent(device.device_name)}`}
                    actionLabel="查看设备事件"
                  />
                ))
              ) : (
                <div style={{ color: "var(--muted)" }}>当前设备日志均已接入。</div>
              )}
            </Panel>

            <Panel title="最近运行事件">
              {overview.recent_events.length ? (
                overview.recent_events.map((event) => (
                  <Row
                    key={event.id}
                    title={event.event_type}
                    subtitle={`${event.severity ?? "unknown"} / ${event.destination_ip ?? "目标待补充"}`}
                    href={event.destination_ip ? `/events?search=${encodeURIComponent(event.destination_ip)}` : "/events"}
                    actionLabel="查看事件证据"
                  />
                ))
              ) : (
                <div style={{ color: "var(--muted)" }}>当前暂无实时事件，仍可查看回放与最近变更。</div>
              )}
            </Panel>
          </div>

          <Panel title="最近策略与处置变更">
            {overview.recent_changes.length ? (
              overview.recent_changes.map((record) => (
                <Row
                  key={record.record_id}
                  title={record.title}
                  subtitle={`${record.source} / ${record.status}`}
                  href={record.related_href}
                  actionLabel="查看来源工作面"
                />
              ))
            ) : (
              <div style={{ color: "var(--muted)" }}>当前暂无策略或处置变更记录。</div>
            )}
          </Panel>
        </div>
      </div>
    </section>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "linear-gradient(180deg, #f8fbff 0%, #eef5fb 100%)", border: "1px solid var(--line)", borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 13, color: "var(--muted)" }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, padding: 18 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div style={{ display: "grid", gap: 10 }}>{children}</div>
    </section>
  );
}

function Row({ title, subtitle, href, actionLabel }: { title: string; subtitle: string; href: string; actionLabel: string }) {
  return (
    <div style={{ borderRadius: 14, padding: 12, background: "#f8fafc", border: "1px solid var(--line)" }}>
      <strong>{title}</strong>
      <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>{subtitle}</div>
      <div style={{ marginTop: 10 }}>
        <QuickLink href={href} label={actionLabel} />
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "6px 10px",
        background: "rgba(11, 99, 206, 0.1)",
        color: "#0b63ce",
        textDecoration: "none",
        fontWeight: 700,
        fontSize: 12
      }}
    >
      {label}
    </Link>
  );
}

function Badge({ tone, children }: { tone: "info" | "danger"; children: React.ReactNode }) {
  return (
    <span
      style={{
        borderRadius: 999,
        padding: "4px 10px",
        background: tone === "info" ? "rgba(11, 99, 206, 0.1)" : "rgba(180, 35, 24, 0.1)",
        color: tone === "info" ? "#0b63ce" : "#b42318",
        fontWeight: 700,
        fontSize: 12
      }}
    >
      {children}
    </span>
  );
}

function PriorityBadge({ label, priority }: { label: string; priority: number }) {
  const color =
    priority <= 1 ? "#b42318" : priority === 2 ? "#b54708" : priority === 3 ? "#0b63ce" : "#667085";
  const background =
    priority <= 1
      ? "rgba(180, 35, 24, 0.1)"
      : priority === 2
        ? "rgba(181, 71, 8, 0.12)"
        : priority === 3
          ? "rgba(11, 99, 206, 0.1)"
          : "rgba(102, 112, 133, 0.12)";

  return (
    <span
      style={{
        borderRadius: 999,
        padding: "4px 10px",
        background,
        color,
        fontWeight: 700,
        fontSize: 12
      }}
    >
      {label}
    </span>
  );
}

function TargetLinks({
  targets
}: {
  targets: Array<{
    label: string;
    href: string;
  }>;
}) {
  if (!targets.length) {
    return null;
  }

  return (
    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <span style={{ color: "var(--muted)", fontSize: 12 }}>优先对象</span>
      {targets.map((target) => (
        <Link
          key={`${target.href}-${target.label}`}
          href={target.href}
          style={{
            borderRadius: 999,
            padding: "5px 10px",
            background: "#fff",
            border: "1px solid var(--line)",
            color: "var(--ink)",
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none"
          }}
        >
          {target.label}
        </Link>
      ))}
    </div>
  );
}
