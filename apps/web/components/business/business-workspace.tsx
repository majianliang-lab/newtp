"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { fetchList } from "../../lib/api";

type Asset = {
  id: number;
  asset_name: string;
  asset_type: string;
  value_level: number;
};

type Flow = {
  id: number;
  protocol: string;
  port: number;
  flow_type: string;
};

type Exposure = {
  id: number;
  public_ip: string;
  open_port: number;
  protocol: string;
  log_visibility_status: string;
};

type Account = {
  id: number;
  account_name: string;
  account_type: string;
  permission_level: string;
  via_bastion: boolean;
};

export function BusinessWorkspace() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [exposures, setExposures] = useState<Exposure[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const [nextAssets, nextFlows, nextExposures, nextAccounts] = await Promise.all([
        fetchList<Asset>("/assets"),
        fetchList<Flow>("/flows"),
        fetchList<Exposure>("/exposures"),
        fetchList<Account>("/accounts")
      ]);

      if (!active) {
        return;
      }

      setAssets(nextAssets);
      setFlows(nextFlows);
      setExposures(nextExposures);
      setAccounts(nextAccounts);
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
            <h2 style={{ margin: 0 }}>资产与业务工作台</h2>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
              汇总高价值资产、核心流向、互联网暴露面和关键账号，形成日常业务视图。
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <QuickLink href="/topology?view=asset-view" label="进入资产拓扑" />
              <QuickLink href="/events" label="查看事件证据" />
              <QuickLink href="/compliance" label="维护基础对象" />
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <MiniCard label="资产总数" value={`${assets.length} 个`} />
            <MiniCard label="核心流向" value={`${flows.length} 条`} />
            <MiniCard label="暴露面" value={`${exposures.length} 项`} />
            <MiniCard label="关键账号" value={`${accounts.length} 个`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Panel title="高价值资产">
              {assets.map((asset) => (
                <Row
                  key={asset.id}
                  title={asset.asset_name}
                  subtitle={`${asset.asset_type} / value ${asset.value_level}`}
                  href={`/topology?view=asset-view&targetType=asset&targetLabel=${encodeURIComponent(asset.asset_name)}&search=${encodeURIComponent(asset.asset_name)}`}
                  actionLabel="定位到拓扑"
                />
              ))}
            </Panel>
            <Panel title="核心业务流向">
              {flows.map((flow) => (
                <Row
                  key={flow.id}
                  title={`${flow.port} / ${flow.flow_type}`}
                  subtitle={`${flow.protocol} / flow-${flow.id}`}
                  href={`/topology?view=flow-view&search=${encodeURIComponent(`${flow.protocol} ${flow.port}`)}`}
                  actionLabel="查看流向"
                />
              ))}
            </Panel>
            <Panel title="互联网暴露面">
              {exposures.map((exposure) => (
                <Row
                  key={exposure.id}
                  title={exposure.public_ip}
                  subtitle={`${exposure.protocol}/${exposure.open_port} / ${exposure.log_visibility_status}`}
                  href={`/events?search=${encodeURIComponent(`${exposure.public_ip} ${exposure.open_port}`)}`}
                  actionLabel="查看相关事件"
                />
              ))}
            </Panel>
            <Panel title="关键账号">
              {accounts.map((account) => (
                <Row
                  key={account.id}
                  title={account.account_name}
                  subtitle={`${account.account_type} / ${account.permission_level} / bastion:${account.via_bastion ? "yes" : "no"}`}
                  href="/compliance"
                  actionLabel="进入合规维护"
                />
              ))}
            </Panel>
          </div>
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
