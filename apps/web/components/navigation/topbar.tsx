import React from "react";

export function Topbar() {
  return (
    <header
      style={{
        height: 72,
        borderBottom: "none",
        background: "var(--header-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        color: "#fff",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)"
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>当前保护对象</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>集团总部四级核心业务网</div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span
          style={{
            borderRadius: 999,
            padding: "8px 12px",
            background: "rgba(255,255,255,0.16)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700
          }}
        >
          GPT-5.4 编排已启用
        </span>
        <span
          style={{
            borderRadius: 999,
            padding: "8px 12px",
            background: "rgba(0,0,0,0.16)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700
          }}
        >
          护网模式待切换
        </span>
      </div>
    </header>
  );
}
