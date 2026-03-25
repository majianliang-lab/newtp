"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { approveChangeRecord, fetchList } from "../../lib/api";

type Device = {
  id: number;
  device_name: string;
  vendor: string;
  device_type: string;
  log_ingest_status: string;
  policy_push_capability: boolean;
};

type ControlPoint = {
  id: number;
  device_id: number;
  control_type: string;
  source_domain_id: number;
  destination_domain_id: number;
  supports_simulation: boolean;
  priority: number;
};

type ChangeRecord = {
  record_id: string;
  source: string;
  title: string;
  status: string;
  approval_status: string;
  summary: string;
  target_devices: string[];
  target_entities: string[];
  execution_mode: string;
  related_href: string;
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

export function StrategyWorkspace() {
  const searchParams = useSearchParams();
  const focusedDeviceName = searchParams.get("searchDevice") ?? "";
  const focusedRecordId = searchParams.get("recordId") ?? "";
  const [devices, setDevices] = useState<Device[]>([]);
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const [changeRecords, setChangeRecords] = useState<ChangeRecord[]>([]);
  const [collectorStatuses, setCollectorStatuses] = useState<CollectorStatus[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const [nextDevices, nextControlPoints, nextChangeRecords, nextCollectorStatuses] = await Promise.all([
        fetchList<Device>("/devices"),
        fetchList<ControlPoint>("/control-points"),
        fetchList<ChangeRecord>("/change-records"),
        fetchList<CollectorStatus>("/collector/statuses")
      ]);

      if (!active) {
        return;
      }

      setDevices(nextDevices);
      setControlPoints(nextControlPoints);
      setChangeRecords(nextChangeRecords);
      setCollectorStatuses(nextCollectorStatuses);
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function handleApprove(recordId: string) {
    const nextRecord = (await approveChangeRecord(recordId)) as ChangeRecord;
    setChangeRecords((current) =>
      current.map((record) => (record.record_id === recordId ? nextRecord : record))
    );
  }

  const connectedDevices = devices.filter((device) => device.log_ingest_status === "connected");
  const disconnectedDevices = devices.filter((device) => device.log_ingest_status !== "connected");
  const readOnlyDevices = devices.filter((device) => !device.policy_push_capability);
  const ingestCoverage = devices.length ? Math.round((connectedDevices.length / devices.length) * 100) : 0;
  const onlineCollectors = collectorStatuses.filter((collector) => collector.online);
  const offlineCollectors = collectorStatuses.filter((collector) => !collector.online);

  return (
    <section style={{ padding: "0 24px 24px" }}>
      <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 20, padding: 20, boxShadow: "0 18px 40px rgba(15, 23, 42, 0.05)" }}>
        <div style={{ display: "grid", gap: 18 }}>
          <div>
            <h2 style={{ margin: 0 }}>策略与设备工作台</h2>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
              汇总安全设备、控制点和仿真能力，作为策略下发与设备治理入口。
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <QuickLink href="/orchestration" label="进入 AI 编排" />
              <QuickLink href="/simulation" label="查看仿真策略" />
              <QuickLink href="/events" label="查看设备事件" />
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <MiniCard label="设备总数" value={`${devices.length} 台`} />
            <MiniCard label="可推策略设备" value={`${devices.filter((item) => item.policy_push_capability).length} 台`} />
            <MiniCard label="控制点" value={`${controlPoints.length} 个`} />
            <MiniCard label="审批中变更" value={`${changeRecords.filter((item) => item.status === "pending_approval").length} 条`} />
          </div>

          <section style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
              <div>
                <h3 style={{ marginTop: 0 }}>设备接入健康度</h3>
                <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                  聚焦日志接入覆盖率和未接入设备，先解决“看不见”的设备，再进入推策略与审批。
                </p>
              </div>
              <QuickLink href="/compliance" label="补齐设备录入" />
            </div>

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: 16 }}>
              <MiniCard label="日志接入率" value={`${ingestCoverage}%`} />
              <MiniCard label="已接入日志" value={`${connectedDevices.length} 台`} />
              <MiniCard label="未接入日志" value={`${disconnectedDevices.length} 台`} />
              <MiniCard label="只读设备" value={`${readOnlyDevices.length} 台`} />
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {disconnectedDevices.length ? (
                disconnectedDevices.map((device) => (
                  <article
                    key={device.id}
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      background: device.device_name === focusedDeviceName ? "#fff5dc" : "#fff8f6",
                      border: `1px solid ${device.device_name === focusedDeviceName ? "#e7b416" : "#f4c7bf"}`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                      <div>
                        <strong>{device.device_name}</strong>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          {device.vendor} / {device.device_type} / 日志状态 {device.log_ingest_status}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "end" }}>
                        {device.device_name === focusedDeviceName ? (
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
                        <span
                          style={{
                            borderRadius: 999,
                            padding: "4px 10px",
                            background: "rgba(180, 35, 24, 0.1)",
                            color: "#b42318",
                            fontWeight: 700,
                            fontSize: 12
                          }}
                        >
                          待接入
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      <QuickLink href={`/events?search=${encodeURIComponent(device.device_name)}`} label="查看未接入设备事件" />
                      <QuickLink href="/compliance" label="补录接入信息" />
                    </div>
                  </article>
                ))
              ) : (
                <div style={{ color: "var(--muted)" }}>当前设备日志均已接入，可继续处理策略编排与控制点治理。</div>
              )}
            </div>
          </section>

          <section style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
              <div>
                <h3 style={{ marginTop: 0 }}>采集器运行态</h3>
                <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                  用采集器在线率和离线实例定位日志接入链问题，避免设备已录入但事件仍进不来。
                </p>
              </div>
              <QuickLink href="/events" label="查看接入事件" />
            </div>

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: 16 }}>
              <MiniCard label="采集器在线率" value={`${onlineCollectors.length} / ${collectorStatuses.length || 0}`} />
              <MiniCard label="在线采集器" value={`${onlineCollectors.length} 台`} />
              <MiniCard label="离线采集器" value={`${offlineCollectors.length} 台`} />
              <MiniCard
                label="主心跳周期"
                value={
                  collectorStatuses[0]
                    ? `${collectorStatuses[0].heartbeat_interval_seconds}s`
                    : "未配置"
                }
              />
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {collectorStatuses.length ? (
                collectorStatuses.map((collector) => (
                  <article
                    key={collector.collector_id}
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      background: collector.online ? "#f6fbff" : "#fff8f6",
                      border: `1px solid ${collector.online ? "rgba(11, 99, 206, 0.18)" : "#f4c7bf"}`
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
                      <span
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          background: collector.online ? "rgba(11, 99, 206, 0.1)" : "rgba(180, 35, 24, 0.1)",
                          color: collector.online ? "#0b63ce" : "#b42318",
                          fontWeight: 700,
                          fontSize: 12
                        }}
                      >
                        {collector.online ? "在线" : "离线"}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <div style={{ color: "var(--muted)" }}>当前尚未收到 collector 心跳，可先启动默认采集器再观察设备接入覆盖率。</div>
              )}
            </div>
          </section>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Panel title="安全设备">
              {devices.map((device) => (
                <Row
                  key={device.id}
                  title={device.device_name}
                  subtitle={`${device.vendor} / ${device.device_type} / ${device.log_ingest_status}`}
                  badge={device.policy_push_capability ? "可推策略" : "只读"}
                  href={device.policy_push_capability ? "/orchestration" : `/events?search=${encodeURIComponent(device.device_name)}`}
                  actionLabel={device.policy_push_capability ? "生成变更编排" : "查看设备事件"}
                />
              ))}
            </Panel>
            <Panel title="控制点">
              {controlPoints.map((point) => (
                <Row
                  key={point.id}
                  title={`${point.source_domain_id} -> ${point.destination_domain_id}`}
                  subtitle={`${point.control_type} / priority ${point.priority}`}
                  badge={point.supports_simulation ? "支持仿真" : "仅监控"}
                  href={point.supports_simulation ? "/simulation" : "/topology?view=domain-view"}
                  actionLabel={point.supports_simulation ? "进入仿真推演" : "查看域间关系"}
                />
              ))}
            </Panel>
          </div>

          <section style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
              <div>
                <h3 style={{ marginTop: 0 }}>最近策略变更</h3>
                <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                  汇总 AI 编排提交和护网页面执行产生的策略记录，形成最小审批闭环。
                </p>
              </div>
              <QuickLink href="/orchestration" label="继续生成编排" />
            </div>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {changeRecords.map((record) => (
                <article
                  key={record.record_id}
                  style={{
                    borderRadius: 14,
                    padding: 14,
                    background: record.record_id === focusedRecordId ? "#fff5dc" : "#f8fafc",
                    border: `1px solid ${record.record_id === focusedRecordId ? "#e7b416" : "var(--line)"}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                    <strong>{record.title}</strong>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "end" }}>
                      {record.record_id === focusedRecordId ? (
                        <span style={{ borderRadius: 999, padding: "4px 10px", background: "rgba(231, 180, 22, 0.14)", color: "#9a6700", fontWeight: 700, fontSize: 12 }}>
                          定位命中
                        </span>
                      ) : null}
                      <span style={{ borderRadius: 999, padding: "4px 10px", background: "rgba(11, 99, 206, 0.1)", color: "#0b63ce", fontWeight: 700, fontSize: 12 }}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                    来源：{record.source} / 设备：{record.target_devices.join(", ") || "待确认"}
                  </div>
                  <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>{record.summary}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {record.status === "pending_approval" ? (
                      <button
                        type="button"
                        aria-label={`批准变更 ${record.record_id}`}
                        onClick={() => void handleApprove(record.record_id)}
                        style={{
                          borderRadius: 999,
                          border: "none",
                          padding: "8px 12px",
                          background: "#0b63ce",
                          color: "#fff",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        模拟批准
                      </button>
                    ) : null}
                    <QuickLink href={record.related_href} label="查看来源工作面" />
                  </div>
                </article>
              ))}
            </div>
          </section>
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

function Row({ title, subtitle, badge, href, actionLabel }: { title: string; subtitle: string; badge: string; href: string; actionLabel: string }) {
  return (
    <div style={{ borderRadius: 14, padding: 12, background: "#f8fafc", border: "1px solid var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
        <strong>{title}</strong>
        <span style={{ borderRadius: 999, padding: "4px 10px", background: "rgba(11, 99, 206, 0.1)", color: "#0b63ce", fontWeight: 700, fontSize: 12 }}>
          {badge}
        </span>
      </div>
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
