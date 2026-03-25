"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "总驾驶舱", href: "/" },
  { label: "动态拓扑中心", href: "/topology" },
  { label: "AI 编排中心", href: "/orchestration" },
  { label: "资产与业务", href: "/business" },
  { label: "策略与设备", href: "/strategy" },
  { label: "运行与接入", href: "/operations" },
  { label: "监控与事件", href: "/events" },
  { label: "应急与护网", href: "/war-room" },
  { label: "合规与备案", href: "/compliance" },
  { label: "仿真与演练", href: "/simulation" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 240,
        borderRight: "none",
        background: "var(--sidebar-bg)",
        padding: "20px 16px"
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#fff" }}>
        拓扑安全平台
      </div>
      <nav aria-label="主导航">
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gap: 8
          }}
        >
          {items.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  style={{
                    display: "block",
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: pathname === item.href ? "rgba(255,255,255,0.12)" : "transparent",
                    color: pathname === item.href ? "#fff" : "var(--sidebar-text)",
                    fontWeight: pathname === item.href ? 700 : 500,
                    textDecoration: "none"
                  }}
                >
                  {item.label}
                </Link>
              ) : (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    color: "var(--sidebar-text)",
                    fontWeight: 500,
                    opacity: 0.66
                  }}
                >
                  {item.label}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
