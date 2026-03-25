import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";

type DomainOption = {
  id: number;
  name: string;
};

type DeviceFormProps = {
  securityDomains?: DomainOption[];
  onCreate?: (payload: {
    device_name: string;
    vendor: string;
    os_type: string;
    device_type: string;
    management_ip: string;
    security_domain_id: number;
    log_ingest_status: string;
    policy_push_capability: boolean;
  }) => Promise<void>;
};

export function DeviceForm({ securityDomains = [], onCreate }: DeviceFormProps) {
  const [deviceName, setDeviceName] = useState("");
  const [managementIp, setManagementIp] = useState("");
  const [securityDomainId, setSecurityDomainId] = useState(
    securityDomains[0]?.id ? String(securityDomains[0].id) : ""
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!onCreate || !deviceName || !managementIp || !securityDomainId) {
      return;
    }

    await onCreate({
      device_name: deviceName,
      vendor: "Topsec",
      os_type: "NGTOS",
      device_type: "edge-fw",
      management_ip: managementIp,
      security_domain_id: Number(securityDomainId),
      log_ingest_status: "connected",
      policy_push_capability: true
    });

    setMessage("设备已录入");
    setDeviceName("");
    setManagementIp("");
  }

  return (
    <section style={panelStyle}>
      <h3 style={titleStyle}>安全设备录入</h3>
      <form onSubmit={(event) => void handleSubmit(event)} style={{ display: "grid", gap: 12 }}>
        <div style={gridStyle}>
          <input
            placeholder="设备名称"
            style={inputStyle}
            value={deviceName}
            onChange={(event) => setDeviceName(event.target.value)}
          />
          <input
            placeholder="管理 IP"
            style={inputStyle}
            value={managementIp}
            onChange={(event) => setManagementIp(event.target.value)}
          />
          <label style={fieldStyle}>
            <span>所属安全域</span>
            <select aria-label="所属安全域" style={inputStyle} value={securityDomainId} onChange={(event) => setSecurityDomainId(event.target.value)}>
              <option value="" disabled>请选择安全域</option>
              {securityDomains.map((domain) => (
                <option key={domain.id} value={domain.id}>{domain.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={actionsStyle}>
          <p style={copyStyle}>录入天融信设备、管理 IP、角色、日志接入状态和策略下发能力。</p>
          <button type="submit" style={buttonStyle}>
            录入设备
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
