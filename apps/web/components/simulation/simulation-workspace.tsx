"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { fetchJson } from "../../lib/api";

type Replay = {
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
    impacted_asset_refs?: Array<{
      label: string;
      target_node_id?: string | null;
    }>;
    ai_summary: string;
  };
};

type ActionPlan = {
  title: string;
  actions: Array<{
    action_id: string;
    title: string;
    description: string;
    target_devices: string[];
    priority: string;
  }>;
};

export function SimulationWorkspace() {
  const [replay, setReplay] = useState<Replay | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const [nextReplay, nextActionPlan] = await Promise.all([
        fetchJson<Replay>("/simulation/replay/smb-445"),
        fetchJson<ActionPlan>("/simulation/actions/smb-445")
      ]);

      if (!active) {
        return;
      }

      setReplay(nextReplay);
      setActionPlan(nextActionPlan);
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section style={{ padding: "0 24px 24px" }}>
      <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 20, padding: 20, boxShadow: "0 18px 40px rgba(15, 23, 42, 0.05)" }}>
        <div style={{ display: "grid", gap: 18 }}>
          <div>
            <h2 style={{ margin: 0 }}>仿真与演练中心</h2>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
              汇总推演场景、处置建议和影响摘要，作为演练脚本与结果查看入口。
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <QuickLink href="/war-room" label="进入应急执行" />
              <QuickLink href="/orchestration" label="交给 AI 编排" />
              <QuickLink href="/topology?view=flow-view" label="查看拓扑流向" />
            </div>
          </div>

          {replay ? (
            <section style={{ background: "linear-gradient(180deg, #fff8f6 0%, #fff1ee 100%)", border: "1px solid #f4c7bf", borderRadius: 18, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{replay.title}</h3>
                  <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>{replay.evidence.ai_summary}</div>
                </div>
                <div style={{ borderRadius: 999, padding: "8px 12px", background: "#fff", border: "1px solid #f4c7bf", fontWeight: 700 }}>
                  {replay.scenario_id}
                </div>
              </div>

              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: 16 }}>
                <MiniCard label="允许流量" value={`${replay.stats.permit_count} 条`} />
                <MiniCard label="阻断流量" value={`${replay.stats.deny_count} 条`} />
                <MiniCard label="策略变更" value={`${replay.stats.policy_change_count} 次`} />
                <MiniCard label="安全事件" value={`${replay.stats.security_event_count} 条`} />
              </div>

              <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 13 }}>受影响资产</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {buildImpactedAssetLinks(replay).map((asset) => (
                  <QuickLink key={asset.label} href={asset.href} label={asset.label} />
                ))}
              </div>
            </section>
          ) : null}

          {actionPlan ? (
            <section style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 18, padding: 18 }}>
              <h3 style={{ marginTop: 0 }}>{actionPlan.title}</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {actionPlan.actions.map((action) => (
                  <article key={action.action_id} style={{ borderRadius: 14, padding: 14, background: "#f8fafc", border: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                      <strong>{action.title}</strong>
                      <span style={{ borderRadius: 999, padding: "4px 10px", background: "rgba(180, 35, 24, 0.1)", color: "#b42318", fontWeight: 700, fontSize: 12 }}>
                        {action.priority}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>{action.description}</div>
                    <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>设备：{action.target_devices.join(", ")}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      <QuickLink href="/war-room" label="进入护网执行" />
                      <QuickLink href="/orchestration" label="生成执行编排" />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function buildImpactedAssetLinks(replay: Replay) {
  if (replay.evidence.impacted_asset_refs?.length) {
    return replay.evidence.impacted_asset_refs.map((item) => ({
      label: item.label,
      href: item.target_node_id
        ? `/topology?view=asset-view&targetNodeId=${encodeURIComponent(item.target_node_id)}&search=${encodeURIComponent(item.label)}`
        : `/topology?view=asset-view&search=${encodeURIComponent(item.label)}`
    }));
  }

  return replay.evidence.impacted_assets.map((item) => ({
    label: item,
    href: `/topology?view=asset-view&search=${encodeURIComponent(item)}`
  }));
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(244, 199, 191, 0.7)", borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 13, color: "var(--muted)" }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>{value}</div>
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
