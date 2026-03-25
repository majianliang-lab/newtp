import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { DashboardWorkspace } from "./dashboard-workspace";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "http://localhost:8000/api/assets") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, asset_name: "ERP-APP-01" },
              { id: 2, asset_name: "FILE-SRV-01" }
            ])
        } as Response);
      }

      if (url === "http://localhost:8000/api/flows") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, protocol: "tcp", port: 443 },
              { id: 2, protocol: "tcp", port: 445 },
              { id: 3, protocol: "udp", port: 53 }
            ])
        } as Response);
      }

      if (url === "http://localhost:8000/api/devices") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, device_name: "FW-HQ-01" },
              { id: 2, device_name: "IPS-HQ-01" }
            ])
        } as Response);
      }

      if (url === "http://localhost:8000/api/events/live") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, event_type: "ips_alert" },
              { id: 2, event_type: "policy_change" }
            ])
        } as Response);
      }

      if (url === "http://localhost:8000/api/simulation/replay/smb-445") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              scenario_id: "smb-445",
              title: "SMB 445 横向移动推演",
              stats: {
                permit_count: 3,
                deny_count: 2,
                policy_change_count: 1,
                security_event_count: 2
              },
              evidence: {
                impacted_assets: ["FILE-SRV-01", "ERP-APP-01"],
                ai_summary: "窗口内共回放 5 条流量。"
              }
            })
        } as Response);
      }

      if (url === "http://localhost:8000/api/dashboard/overview") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              high_value_asset_count: 2,
              exposure_count: 1,
              log_coverage_rate: 100,
              high_risk_event_count: 1,
              pending_change_count: 1,
              executed_change_count: 1,
              collector_total_count: 2,
              collector_online_count: 2,
              collector_status: {
                collector_id: "collector-local-01",
                host: "0.0.0.0",
                port: 5514,
                api_ingest_url: "http://localhost:8000/api/events/ingest",
                heartbeat_interval_seconds: 30,
                online: true,
                last_seen_at: "2026-03-24T08:00:00+00:00"
              },
              collector_statuses: [
                {
                  collector_id: "collector-local-01",
                  host: "0.0.0.0",
                  port: 5514,
                  api_ingest_url: "http://localhost:8000/api/events/ingest",
                  heartbeat_interval_seconds: 30,
                  online: true,
                  last_seen_at: "2026-03-24T08:00:00+00:00"
                },
                {
                  collector_id: "collector-branch-02",
                  host: "10.10.10.20",
                  port: 5515,
                  api_ingest_url: "http://localhost:8000/api/events/ingest",
                  heartbeat_interval_seconds: 60,
                  online: true,
                  last_seen_at: "2026-03-24T07:58:00+00:00"
                }
              ],
              recent_changes: [
                {
                  record_id: "change-002",
                  source: "war_room",
                  title: "批量下发 445 黑名单阻断",
                  status: "executed",
                  related_href: "/war-room"
                },
                {
                  record_id: "change-001",
                  source: "orchestration",
                  title: "全网 TCP 445 横向阻断",
                  status: "pending_approval",
                  related_href: "/strategy"
                }
              ],
              focus: {
                scenario_id: "smb-445-containment",
                title: "445 护网应急推演",
                summary: "窗口内共回放 5 条流量。"
              }
            })
        } as Response);
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve([])
      } as Response);
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("dashboard workspace renders platform overview with live module entries", async () => {
  render(<DashboardWorkspace />);

  expect(await screen.findByText("总驾驶舱")).toBeInTheDocument();
  expect(screen.getByText("资产对象")).toBeInTheDocument();
  expect(screen.getByText("业务流向")).toBeInTheDocument();
  expect(screen.getByText("安全设备")).toBeInTheDocument();
  expect(screen.getByText("实时事件")).toBeInTheDocument();
  expect(screen.getByText("待审批变更")).toBeInTheDocument();
  expect(screen.getByText("2 个")).toBeInTheDocument();
  expect(screen.getByText("2 台")).toBeInTheDocument();
  expect(screen.getByText("collector-local-01")).toBeInTheDocument();
  expect(screen.getByText("collector-branch-02")).toBeInTheDocument();
  expect(screen.getByText("0.0.0.0:5514")).toBeInTheDocument();
  expect(screen.getByText("2/2 在线")).toBeInTheDocument();
  expect(screen.getByText("SMB 445 横向移动推演")).toBeInTheDocument();
  expect(screen.getByText("FILE-SRV-01, ERP-APP-01")).toBeInTheDocument();
  expect(screen.getByText("批量下发 445 黑名单阻断")).toBeInTheDocument();
  expect(screen.getByText("全网 TCP 445 横向阻断")).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: "查看策略审批" })).toHaveLength(2);
  expect(screen.getByRole("link", { name: "collector-local-01" })).toHaveAttribute(
    "href",
    "/operations?collectorId=collector-local-01"
  );
  expect(screen.getByRole("link", { name: "collector-branch-02" })).toHaveAttribute(
    "href",
    "/operations?collectorId=collector-branch-02"
  );
  expect(screen.getByRole("link", { name: "全网 TCP 445 横向阻断" })).toHaveAttribute(
    "href",
    "/strategy?recordId=change-001"
  );
  expect(screen.getByRole("link", { name: "进入监控与事件工作台" })).toHaveAttribute("href", "/events");
  expect(screen.getByRole("link", { name: "进入资产与业务" })).toHaveAttribute("href", "/business");
  expect(screen.getByRole("link", { name: "进入策略与设备" })).toHaveAttribute("href", "/strategy");
  expect(screen.getByRole("link", { name: "进入运行与接入" })).toHaveAttribute("href", "/operations");
  expect(screen.getByRole("link", { name: "进入监控与事件" })).toHaveAttribute("href", "/events");
  expect(screen.getByRole("link", { name: "进入合规与备案" })).toHaveAttribute("href", "/compliance");
  expect(screen.getAllByRole("link", { name: "进入应急与护网" })).toHaveLength(2);
  expect(screen.getAllByRole("link", { name: "进入仿真与演练" })).toHaveLength(2);
});
