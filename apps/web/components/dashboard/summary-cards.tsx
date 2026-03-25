"use client";

import React, { useEffect, useState } from "react";

import { fetchJson } from "../../lib/api";

type DashboardOverview = {
  high_value_asset_count: number;
  exposure_count: number;
  log_coverage_rate: number;
  high_risk_event_count: number;
  pending_change_count: number;
  collector_total_count?: number;
  collector_online_count?: number;
};

export function SummaryCards() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const nextOverview = await fetchJson<DashboardOverview>("/dashboard/overview");

        if (!active || !nextOverview) {
          return;
        }

        setOverview(nextOverview);
      } catch {
        if (!active) {
          return;
        }

        setOverview(null);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const cards = [
    { label: "高价值资产", value: `${overview?.high_value_asset_count ?? 0}`, tone: "#0b63ce" },
    { label: "互联网暴露面", value: `${overview?.exposure_count ?? 0}`, tone: "#d97706" },
    { label: "日志接入率", value: `${overview?.log_coverage_rate ?? 0}%`, tone: "#0f766e" },
    { label: "高危事件", value: `${overview?.high_risk_event_count ?? 0}`, tone: "#cf3341" },
    { label: "待审批变更", value: `${overview?.pending_change_count ?? 0}`, tone: "#7c3aed" },
    {
      label: "Collector 在线",
      value: `${overview?.collector_online_count ?? 0}/${overview?.collector_total_count ?? 0}`,
      tone: (overview?.collector_online_count ?? 0) > 0 ? "#147a4d" : "#b42318"
    }
  ];

  return (
    <section
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        padding: 24
      }}
    >
      {cards.map((card) => (
        <article
          key={card.label}
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 18,
            padding: 18,
            boxShadow: "0 12px 40px rgba(15, 23, 42, 0.05)"
          }}
        >
          <div style={{ color: "var(--muted)", fontSize: 13 }}>{card.label}</div>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: card.tone }}>
            {card.value}
          </div>
        </article>
      ))}
    </section>
  );
}
