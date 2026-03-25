import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";

type AssetOption = {
  id: number;
  asset_name: string;
};

type ExposureFormProps = {
  assets?: AssetOption[];
  onCreate?: (payload: {
    public_ip: string;
    open_port: number;
    protocol: string;
    backend_asset_id: number;
    security_domain_id: number;
    log_visibility_status: string;
  }) => Promise<void>;
};

export function ExposureForm({ assets = [], onCreate }: ExposureFormProps) {
  const [publicIp, setPublicIp] = useState("");
  const [openPort, setOpenPort] = useState("");
  const [assetId, setAssetId] = useState(assets[0]?.id ? String(assets[0].id) : "");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!onCreate || !publicIp || !openPort || !assetId) {
      return;
    }

    await onCreate({
      public_ip: publicIp,
      open_port: Number(openPort),
      protocol: "tcp",
      backend_asset_id: Number(assetId),
      security_domain_id: 1,
      log_visibility_status: "visible"
    });

    setMessage("暴露面已录入");
    setPublicIp("");
    setOpenPort("");
  }

  return (
    <section style={panelStyle}>
      <h3 style={titleStyle}>互联网暴露面录入</h3>
      <form onSubmit={(event) => void handleSubmit(event)} style={{ display: "grid", gap: 12 }}>
        <div style={gridStyle}>
          <input
            placeholder="公网 IP"
            style={inputStyle}
            value={publicIp}
            onChange={(event) => setPublicIp(event.target.value)}
          />
          <input
            placeholder="开放端口"
            style={inputStyle}
            value={openPort}
            onChange={(event) => setOpenPort(event.target.value)}
          />
          <label style={fieldStyle}>
            <span>关联资产</span>
            <select
              aria-label="关联资产"
              style={inputStyle}
              value={assetId}
              onChange={(event) => setAssetId(event.target.value)}
            >
              <option value="" disabled>
                请选择资产
              </option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={actionsStyle}>
          <p style={copyStyle}>录入公网 IP、域名、开放端口、前置控制点和日志可见性。</p>
          <button type="submit" style={buttonStyle}>
            录入暴露面
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
