"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AccountForm } from "./account-form";
import { AssetForm } from "./asset-form";
import { ControlPointForm } from "./control-point-form";
import { DeviceForm } from "./device-form";
import { ExposureForm } from "./exposure-form";
import { FlowForm } from "./flow-form";
import {
  createAccount,
  createAsset,
  createControlPoint,
  createDevice,
  createExposure,
  createFlow,
  fetchJson,
  fetchList,
  fetchListCount,
  API_BASE_URL
} from "../../lib/api";

type Option = {
  id: number;
  name: string;
};

type AssetOption = {
  id: number;
  asset_name: string;
};

type DeviceOption = {
  id: number;
  device_name: string;
};

type FlowOption = {
  id: number;
  source_asset_id: number;
  source_domain_id: number;
  destination_asset_id: number;
  destination_domain_id: number;
  protocol: string;
  port: number;
  flow_type: string;
};

type ComplianceReport = {
  filing_readiness: number;
  summary: string;
  sections: Array<{
    section_id: string;
    title: string;
    count: number;
    status: string;
    workspace_href: string;
    sample_items: string[];
  }>;
};

const tabs = [
  "高价值资产",
  "互联网暴露面",
  "账号权限矩阵",
  "核心业务流向",
  "安全设备",
  "控制点"
] as const;

export function TemplateCenter() {
  const [protectionObjects, setProtectionObjects] = useState<Option[]>([]);
  const [securityDomains, setSecurityDomains] = useState<Option[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [flows, setFlows] = useState<FlowOption[]>([]);
  const [recentChanges, setRecentChanges] = useState<string[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [counts, setCounts] = useState({
    protectionObjects: 0,
    securityDomains: 0,
    assets: 0,
    devices: 0
  });

  const assetNameById = Object.fromEntries(assets.map((asset) => [asset.id, asset.asset_name]));

  function recordChange(label: string) {
    setRecentChanges((current) => [label, ...current].slice(0, 6));
  }

  useEffect(() => {
    let active = true;

    async function loadCounts() {
      const [
        protectionObjects,
        securityDomains,
        assets,
        devices,
        protectionObjectList,
        securityDomainList,
        assetList,
        deviceList,
        flowList,
        report
      ] = await Promise.all([
        fetchListCount("/protection-objects"),
        fetchListCount("/security-domains"),
        fetchListCount("/assets"),
        fetchListCount("/devices"),
        fetchList<Option>("/protection-objects"),
        fetchList<Option>("/security-domains"),
        fetchList<AssetOption>("/assets"),
        fetchList<DeviceOption>("/devices"),
        fetchList<FlowOption>("/flows"),
        fetchJson<ComplianceReport>("/compliance/report")
      ]);

      if (!active) {
        return;
      }

      setCounts({
        protectionObjects,
        securityDomains,
        assets,
        devices
      });
      setProtectionObjects(protectionObjectList);
      setSecurityDomains(securityDomainList);
      setAssets(assetList);
      setDevices(deviceList);
      setFlows(flowList);
      setComplianceReport(report);
    }

    void loadCounts();

    return () => {
      active = false;
    };
  }, []);

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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0 }}>模板录入中心</h2>
            <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
              以统一对象模型录入保护对象、安全域、资产、流向、设备和控制点。
            </p>
          </div>
          <button
            type="button"
            style={{
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 999,
              padding: "10px 16px",
              fontWeight: 700
            }}
          >
            Excel 映射导入
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            marginTop: 20
          }}
        >
          <MetricCard label="保护对象" value={counts.protectionObjects} tone="#ae1d22" />
          <MetricCard label="安全域" value={counts.securityDomains} tone="#304156" />
          <MetricCard label="已录入资产" value={counts.assets} tone="#0b63ce" />
          <MetricCard label="已纳管设备" value={counts.devices} tone="#0f766e" />
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 20,
            marginBottom: 20
          }}
        >
          <QuickLink href="/business" label="进入资产与业务" />
          <QuickLink href="/strategy" label="进入策略与设备" />
          <QuickLink href="/topology?view=asset-view" label="查看对象拓扑" />
          {tabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              style={{
                border: "1px solid",
                borderColor: index === 0 ? "var(--accent)" : "var(--line)",
                background: index === 0 ? "var(--accent-soft)" : "#fff",
                color: index === 0 ? "var(--accent)" : "var(--text)",
                borderRadius: 999,
                padding: "9px 14px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <section
          aria-label="最近录入对象"
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            marginBottom: 20
          }}
        >
          <RecentObjectCard
            title="最近录入资产"
            emptyLabel="暂无资产"
            items={getRecentItems(assets).map((asset) => ({
              label: asset.asset_name,
              href: `/topology?view=asset-view&targetType=asset&targetLabel=${encodeURIComponent(asset.asset_name)}&search=${encodeURIComponent(asset.asset_name)}`
            }))}
          />
          <RecentObjectCard
            title="最近纳管设备"
            emptyLabel="暂无设备"
            items={getRecentItems(devices).map((device) => ({
              label: device.device_name,
              href: `/strategy`
            }))}
          />
          <RecentObjectCard
            title="最近录入流向"
            emptyLabel="暂无流向"
            items={getRecentItems(flows).map((flow) => ({
              label: formatFlowLabel(flow, assetNameById),
              href: `/topology?view=flow-view&search=${encodeURIComponent(`${flow.protocol} ${flow.port}`)}`
            }))}
          />
        </section>

        <section aria-label="最近变更" style={{ marginBottom: 20 }}>
          <RecentObjectCard title="最近变更" emptyLabel="暂无最近变更" items={recentChanges} />
        </section>

        {complianceReport ? (
          <section
            aria-label="备案摘要"
            style={{
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)",
              marginBottom: 20
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>备案摘要</h3>
                <div style={{ color: "var(--muted)" }}>{complianceReport.summary}</div>
              </div>
              <div
                style={{
                  borderRadius: 999,
                  padding: "10px 14px",
                  background: "rgba(11, 99, 206, 0.1)",
                  color: "#0b63ce",
                  fontWeight: 800
                }}
              >
                Readiness {complianceReport.filing_readiness}%
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                marginTop: 16
              }}
            >
              {complianceReport.sections.map((section) => (
                <article
                  key={section.section_id}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 14,
                    padding: 14,
                    background: section.status === "ready" ? "#f8fbff" : "#fff7ed"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <strong>{section.title}</strong>
                    <span style={{ fontSize: 12, color: section.status === "ready" ? "#0f766e" : "#b45309", fontWeight: 700 }}>
                      {section.status === "ready" ? "已具备" : "待补录"}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800 }}>{section.count}</div>
                  <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13, minHeight: 38 }}>
                    {section.sample_items.length ? section.sample_items.join(" / ") : "当前还没有样本对象"}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <QuickLink href={section.workspace_href} label={`查看${section.title}`} />
                  </div>
                </article>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              <a
                href={`${API_BASE_URL}/compliance/report`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: 999,
                  padding: "9px 14px",
                  background: "#111827",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 700
                }}
              >
                下载备案 JSON
              </a>
              <QuickLink href="/business" label="进入资产与业务" />
              <QuickLink href="/strategy" label="进入策略与设备" />
            </div>
          </section>
        ) : null}

        <div style={{ display: "grid", gap: 16 }}>
          <AssetForm
            protectionObjects={protectionObjects}
            securityDomains={securityDomains}
            onCreate={async (payload) => {
              const createdAsset = (await createAsset(payload)) as { asset_name?: string };

              const [assetCount, assetList] = await Promise.all([
                fetchListCount("/assets"),
                fetchList<AssetOption>("/assets")
              ]);
              setCounts((current) => ({
                ...current,
                assets: assetCount
              }));
              setAssets(assetList);
              recordChange(`新增资产 ${createdAsset.asset_name ?? payload.asset_name}`);
            }}
          />
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <ExposureForm
              assets={assets}
              onCreate={async (payload) => {
                await createExposure(payload);
                recordChange(`新增暴露面 ${payload.public_ip}:${payload.open_port}`);
              }}
            />
            <AccountForm
              onCreate={async (payload) => {
                await createAccount(payload);
                recordChange(`新增账号 ${payload.account_name}`);
              }}
            />
            <FlowForm
              assets={assets}
              securityDomains={securityDomains}
              onCreate={async (payload) => {
                await createFlow(payload);
                const flowList = await fetchList<FlowOption>("/flows");
                setFlows(flowList);
                recordChange(`新增流向 ${formatFlowPayloadLabel(payload, assetNameById)}`);
              }}
            />
            <DeviceForm
              securityDomains={securityDomains}
              onCreate={async (payload) => {
                await createDevice(payload);
                const [deviceCount, deviceList] = await Promise.all([
                  fetchListCount("/devices"),
                  fetchList<DeviceOption>("/devices")
                ]);
                setCounts((current) => ({
                  ...current,
                  devices: deviceCount
                }));
                setDevices(deviceList);
                recordChange(`新增设备 ${payload.device_name}`);
              }}
            />
          </div>
          <ControlPointForm
            devices={devices}
            securityDomains={securityDomains}
            onCreate={async (payload) => {
              await createControlPoint(payload);
              recordChange(`新增控制点 device-${payload.device_id}`);
            }}
          />
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <article
      style={{
        border: "1px solid var(--line)",
        background: "#fff",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)"
      }}
    >
      <div style={{ color: "var(--muted)", fontSize: 13 }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 30, fontWeight: 800, color: tone }}>{value}</div>
    </article>
  );
}

function RecentObjectCard({
  title,
  emptyLabel,
  items
}: {
  title: string;
  emptyLabel: string;
  items: Array<string | { label: string; href: string }>;
}) {
  return (
    <article
      style={{
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)"
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>{title}</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {items.length ? (
          items.map((item) => (
            <RecentItem key={typeof item === "string" ? item : `${item.label}-${item.href}`} item={item} />
          ))
        ) : (
          <div style={{ color: "var(--muted)" }}>{emptyLabel}</div>
        )}
      </div>
    </article>
  );
}

function RecentItem({ item }: { item: string | { label: string; href: string } }) {
  const style = {
    display: "block",
    padding: "10px 12px",
    borderRadius: 12,
    background: "var(--accent-soft)",
    color: "var(--text)",
    fontWeight: 700,
    textDecoration: "none"
  } as const;

  if (typeof item === "string") {
    return <div style={style}>{item}</div>;
  }

  return (
    <Link href={item.href} style={style}>
      {item.label}
    </Link>
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
        padding: "9px 14px",
        background: "rgba(11, 99, 206, 0.1)",
        color: "#0b63ce",
        textDecoration: "none",
        fontWeight: 700
      }}
    >
      {label}
    </Link>
  );
}

function getRecentItems<T>(items: T[]): T[] {
  return items.slice(-3).reverse();
}

function formatFlowLabel(flow: FlowOption, assetNameById: Record<number, string>) {
  const sourceName = assetNameById[flow.source_asset_id] ?? `asset-${flow.source_asset_id}`;
  const destinationName = assetNameById[flow.destination_asset_id] ?? `asset-${flow.destination_asset_id}`;

  return `${sourceName} -> ${destinationName} ${flow.protocol}/${flow.port}`;
}

function formatFlowPayloadLabel(
  payload: {
    source_asset_id: number;
    destination_asset_id: number;
    protocol: string;
    port: number;
  },
  assetNameById: Record<number, string>
) {
  const sourceName = assetNameById[payload.source_asset_id] ?? `asset-${payload.source_asset_id}`;
  const destinationName = assetNameById[payload.destination_asset_id] ?? `asset-${payload.destination_asset_id}`;

  return `${sourceName} -> ${destinationName} ${payload.protocol}/${payload.port}`;
}
