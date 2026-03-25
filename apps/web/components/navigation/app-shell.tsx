import React, { type ReactNode } from "react";
import { SummaryCards } from "../dashboard/summary-cards";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "240px 1fr"
      }}
    >
      <Sidebar />
      <div style={{ display: "grid", gridTemplateRows: "72px auto 1fr" }}>
        <Topbar />
        <SummaryCards />
        <main>{children}</main>
      </div>
    </div>
  );
}
