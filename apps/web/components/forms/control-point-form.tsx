import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";

type DeviceOption = {
  id: number;
  device_name: string;
};

type DomainOption = {
  id: number;
  name: string;
};

type ControlPointFormProps = {
  devices?: DeviceOption[];
  securityDomains?: DomainOption[];
  onCreate?: (payload: {
    device_id: number;
    control_type: string;
    source_domain_id: number;
    destination_domain_id: number;
    supports_simulation: boolean;
    priority: number;
  }) => Promise<void>;
};

export function ControlPointForm({
  devices = [],
  securityDomains = [],
  onCreate
}: ControlPointFormProps) {
  const [deviceId, setDeviceId] = useState(devices[0]?.id ? String(devices[0].id) : "");
  const [sourceDomainId, setSourceDomainId] = useState(
    securityDomains[0]?.id ? String(securityDomains[0].id) : ""
  );
  const [destinationDomainId, setDestinationDomainId] = useState(
    securityDomains[0]?.id ? String(securityDomains[0].id) : ""
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!onCreate || !deviceId || !sourceDomainId || !destinationDomainId) {
      return;
    }

    await onCreate({
      device_id: Number(deviceId),
      control_type: "boundary_block",
      source_domain_id: Number(sourceDomainId),
      destination_domain_id: Number(destinationDomainId),
      supports_simulation: true,
      priority: 100
    });

    setMessage("控制点已录入");
  }

  return (
    <section style={panelStyle}>
      <h3 style={titleStyle}>控制点录入</h3>
      <form onSubmit={(event) => void handleSubmit(event)} style={{ display: "grid", gap: 12 }}>
        <div style={gridStyle}>
          <label style={fieldStyle}>
            <span>关联设备</span>
            <select aria-label="关联设备" style={inputStyle} value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>
              <option value="" disabled>请选择设备</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>{device.device_name}</option>
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
            <span>目标安全域</span>
            <select aria-label="目标安全域" style={inputStyle} value={destinationDomainId} onChange={(event) => setDestinationDomainId(event.target.value)}>
              <option value="" disabled>请选择目标安全域</option>
              {securityDomains.map((domain) => (
                <option key={domain.id} value={domain.id}>{domain.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={actionsStyle}>
          <p style={copyStyle}>录入控制点覆盖源域、目的域、优先级、仿真能力和审批级别。</p>
          <button type="submit" style={buttonStyle}>
            录入控制点
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
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))"
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
