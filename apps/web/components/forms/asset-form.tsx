import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";

type Option = {
  id: number;
  name: string;
};

type AssetFormProps = {
  protectionObjects?: Option[];
  securityDomains?: Option[];
  onCreate?: (payload: {
    asset_name: string;
    asset_type: string;
    protection_object_id: number;
    security_domain_id: number;
    value_level: number;
  }) => Promise<void>;
};

export function AssetForm({
  protectionObjects = [],
  securityDomains = [],
  onCreate
}: AssetFormProps) {
  const [assetName, setAssetName] = useState("");
  const [protectionObjectId, setProtectionObjectId] = useState(
    protectionObjects[0]?.id ? String(protectionObjects[0].id) : ""
  );
  const [securityDomainId, setSecurityDomainId] = useState(
    securityDomains[0]?.id ? String(securityDomains[0].id) : ""
  );
  const [valueLevel, setValueLevel] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      asset_name: assetName,
      asset_type: "server",
      protection_object_id: Number(protectionObjectId),
      security_domain_id: Number(securityDomainId),
      value_level: Number(valueLevel)
    };

    if (onCreate && assetName && protectionObjectId && securityDomainId) {
      await onCreate(payload);
      setMessage("资产已录入");
      setAssetName("");
      setValueLevel("");
    }
  }

  return (
    <section
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 18,
        padding: 20
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>高价值资产录入</h3>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <input
            placeholder="资产名称"
            style={inputStyle}
            value={assetName}
            onChange={(event) => setAssetName(event.target.value)}
          />
          <label style={fieldStyle}>
            <span>所属安全域</span>
            <select
              aria-label="所属安全域"
              style={inputStyle}
              value={securityDomainId}
              onChange={(event) => setSecurityDomainId(event.target.value)}
            >
              <option value="" disabled>
                请选择安全域
              </option>
              {securityDomains.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <label style={fieldStyle}>
            <span>所属保护对象</span>
            <select
              aria-label="所属保护对象"
              style={inputStyle}
              value={protectionObjectId}
              onChange={(event) => setProtectionObjectId(event.target.value)}
            >
              <option value="" disabled>
                请选择保护对象
              </option>
              {protectionObjects.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          <input
            placeholder="重要级别"
            style={inputStyle}
            value={valueLevel}
            onChange={(event) => setValueLevel(event.target.value)}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, alignItems: "center" }}>
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            默认资产类型按服务器录入，后续可扩展为数据库、域控、堡垒机等。
          </span>
          <button
            type="submit"
            style={{
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              borderRadius: 999,
              padding: "10px 16px",
              fontWeight: 700
            }}
          >
            录入资产
          </button>
        </div>
        {message ? <p style={{ margin: "12px 0 0", color: "var(--accent)" }}>{message}</p> : null}
      </form>
    </section>
  );
}

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
