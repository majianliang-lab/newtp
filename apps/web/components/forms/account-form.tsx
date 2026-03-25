import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";

type AccountFormProps = {
  onCreate?: (payload: {
    account_name: string;
    account_type: string;
    permission_level: string;
    via_bastion: boolean;
    mfa_enabled: boolean;
  }) => Promise<void>;
};

export function AccountForm({ onCreate }: AccountFormProps) {
  const [accountName, setAccountName] = useState("");
  const [permissionLevel, setPermissionLevel] = useState("admin");
  const [viaBastion, setViaBastion] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!onCreate || !accountName) {
      return;
    }

    await onCreate({
      account_name: accountName,
      account_type: "human",
      permission_level: permissionLevel,
      via_bastion: viaBastion,
      mfa_enabled: mfaEnabled
    });

    setMessage("账号已录入");
    setAccountName("");
    setViaBastion(false);
    setMfaEnabled(false);
  }

  return (
    <section style={panelStyle}>
      <h3 style={titleStyle}>账号权限矩阵录入</h3>
      <form onSubmit={(event) => void handleSubmit(event)} style={{ display: "grid", gap: 12 }}>
        <div style={gridStyle}>
          <input
            placeholder="账号名称"
            style={inputStyle}
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
          />
          <label style={fieldStyle}>
            <span>权限级别</span>
            <select
              aria-label="权限级别"
              style={inputStyle}
              value={permissionLevel}
              onChange={(event) => setPermissionLevel(event.target.value)}
            >
              <option value="read">read</option>
              <option value="operate">operate</option>
              <option value="admin">admin</option>
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <label style={checkboxStyle}>
            <input
              aria-label="经堡垒机"
              type="checkbox"
              checked={viaBastion}
              onChange={(event) => setViaBastion(event.target.checked)}
            />
            经堡垒机
          </label>
          <label style={checkboxStyle}>
            <input
              aria-label="启用 MFA"
              type="checkbox"
              checked={mfaEnabled}
              onChange={(event) => setMfaEnabled(event.target.checked)}
            />
            启用 MFA
          </label>
        </div>
        <div style={actionsStyle}>
          <p style={copyStyle}>录入员工号、系统账号、权限级别、登录入口、MFA 和堡垒机关系。</p>
          <button type="submit" style={buttonStyle}>
            录入账号
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
const checkboxStyle = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  color: "var(--text)"
} satisfies CSSProperties;
const messageStyle = {
  margin: 0,
  color: "var(--accent)"
} satisfies CSSProperties;
