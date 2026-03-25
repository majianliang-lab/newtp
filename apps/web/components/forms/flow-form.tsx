import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";

type AssetOption = {
  id: number;
  asset_name: string;
};

type DomainOption = {
  id: number;
  name: string;
};

type FlowFormProps = {
  assets?: AssetOption[];
  securityDomains?: DomainOption[];
  onCreate?: (payload: {
    source_asset_id: number;
    source_domain_id: number;
    destination_asset_id: number;
    destination_domain_id: number;
    protocol: string;
    port: number;
    flow_type: string;
  }) => Promise<void>;
};

export function FlowForm({
  assets = [],
  securityDomains = [],
  onCreate
}: FlowFormProps) {
  const [sourceAssetId, setSourceAssetId] = useState(assets[0]?.id ? String(assets[0].id) : "");
  const [sourceDomainId, setSourceDomainId] = useState(
    securityDomains[0]?.id ? String(securityDomains[0].id) : ""
  );
  const [destinationAssetId, setDestinationAssetId] = useState(
    assets[1]?.id ? String(assets[1].id) : assets[0]?.id ? String(assets[0].id) : ""
  );
  const [destinationDomainId, setDestinationDomainId] = useState(
    securityDomains[1]?.id ? String(securityDomains[1].id) : securityDomains[0]?.id ? String(securityDomains[0].id) : ""
  );
  const [port, setPort] = useState("");
  const [flowType, setFlowType] = useState("east_west");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !onCreate ||
      !sourceAssetId ||
      !sourceDomainId ||
      !destinationAssetId ||
      !destinationDomainId ||
      !port
    ) {
      return;
    }

    await onCreate({
      source_asset_id: Number(sourceAssetId),
      source_domain_id: Number(sourceDomainId),
      destination_asset_id: Number(destinationAssetId),
      destination_domain_id: Number(destinationDomainId),
      protocol: "tcp",
      port: Number(port),
      flow_type: flowType
    });

    setMessage("流向已录入");
    setPort("");
  }

  return (
    <section style={panelStyle}>
      <h3 style={titleStyle}>核心业务流向录入</h3>
      <form onSubmit={(event) => void handleSubmit(event)} style={{ display: "grid", gap: 12 }}>
        <div style={gridStyle}>
          <label style={fieldStyle}>
            <span>源资产</span>
            <select aria-label="源资产" style={inputStyle} value={sourceAssetId} onChange={(event) => setSourceAssetId(event.target.value)}>
              <option value="" disabled>请选择源资产</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.asset_name}</option>
              ))}
            </select>
          </label>
          <label style={fieldStyle}>
            <span>源安全域</span>
            <select aria-label="源安全域" style={inputStyle} value={sourceDomainId} onChange={(event) => setSourceDomainId(event.target.value)}>
              <option value="" disabled>请选择源安全域</option>
              {securityDomains.map((domain) => (
                <option key={domain.id} value={domain.id}>{domain.name}</option>
              ))}
            </select>
          </label>
          <label style={fieldStyle}>
            <span>目标资产</span>
            <select aria-label="目标资产" style={inputStyle} value={destinationAssetId} onChange={(event) => setDestinationAssetId(event.target.value)}>
              <option value="" disabled>请选择目标资产</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.asset_name}</option>
              ))}
            </select>
          </label>
          <label style={fieldStyle}>
            <span>目标安全域</span>
            <select aria-label="目标安全域" style={inputStyle} value={destinationDomainId} onChange={(event) => setDestinationDomainId(event.target.value)}>
              <option value="" disabled>请选择目标安全域</option>
              {securityDomains.map((domain) => (
                <option key={domain.id} value={domain.id}>{domain.name}</option>
              ))}
            </select>
          </label>
          <input
            placeholder="端口"
            style={inputStyle}
            value={port}
            onChange={(event) => setPort(event.target.value)}
          />
          <label style={fieldStyle}>
            <span>流向类型</span>
            <select aria-label="流向类型" style={inputStyle} value={flowType} onChange={(event) => setFlowType(event.target.value)}>
              <option value="north_south">north_south</option>
              <option value="east_west">east_west</option>
              <option value="ops_admin">ops_admin</option>
            </select>
          </label>
        </div>
        <div style={actionsStyle}>
          <p style={copyStyle}>录入源、目的、安全域、端口、流量方向、控制点和日志状态。</p>
          <button type="submit" style={buttonStyle}>
            录入流向
          </button>
        </div>
        {message ? <p style={messageStyle}>{message}</p> : null}
      </form>
    </section>
  );
}

const panelStyle = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 18,
  padding: 20
} satisfies CSSProperties;

const titleStyle = { marginTop: 0, marginBottom: 12 } satisfies CSSProperties;
const copyStyle = { margin: 0, color: "var(--muted)" } satisfies CSSProperties;
const gridStyle = {
  display: "grid",
  gap: 10,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))"
} satisfies CSSProperties;
const fieldStyle = {
  display: "grid",
  gap: 8,
  color: "var(--muted)",
  fontSize: 13
} satisfies CSSProperties;
const inputStyle = {
  border: "1px solid var(--line)",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14,
  background: "#fff"
} satisfies CSSProperties;
const actionsStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center"
} satisfies CSSProperties;
const buttonStyle = {
  border: "none",
  background: "var(--accent)",
  color: "#fff",
  borderRadius: 999,
  padding: "10px 16px",
  fontWeight: 700
} satisfies CSSProperties;
const messageStyle = {
  margin: 0,
  color: "var(--accent)"
} satisfies CSSProperties;
