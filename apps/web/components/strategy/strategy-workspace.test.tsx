import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, vi } from "vitest";

import { StrategyWorkspace } from "./strategy-workspace";

let searchParams = new URLSearchParams();

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams
}));

beforeEach(() => {
  searchParams = new URLSearchParams();
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "http://localhost:8000/api/devices") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, device_name: "FW-HQ-01", vendor: "Topsec", os_type: "NGTOS", device_type: "edge-fw", management_ip: "10.0.0.1", security_domain_id: 1, log_ingest_status: "connected", policy_push_capability: true },
              { id: 2, device_name: "IPS-HQ-01", vendor: "Topsec", os_type: "NGIPS", device_type: "ips", management_ip: "10.0.0.2", security_domain_id: 1, log_ingest_status: "connected", policy_push_capability: false },
              { id: 3, device_name: "AV-BRANCH-01", vendor: "Topsec", os_type: "NGAV", device_type: "av", management_ip: "10.0.1.3", security_domain_id: 1, log_ingest_status: "disconnected", policy_push_capability: false }
            ])
        } as Response);
      }

      if (url === "http://localhost:8000/api/control-points") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, device_id: 1, control_type: "interzone", source_domain_id: 1, destination_domain_id: 2, supports_simulation: true, priority: 10 }
            ])
        } as Response);
      }

      if (url === "http://localhost:8000/api/change-records") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                record_id: "change-001",
                source: "orchestration",
                title: "全网 TCP 445 横向阻断",
                status: "pending_approval",
                approval_status: "pending_approval",
                summary: "等待审批后执行跨域 445 阻断。",
                target_devices: ["FW-HQ-01"],
                target_entities: ["10.10.32.45"],
                execution_mode: "planned",
                related_href: "/orchestration"
              },
              {
                record_id: "change-002",
                source: "war_room",
                title: "批量下发 445 黑名单阻断",
                status: "executed",
                approval_status: "approved",
                summary: "已模拟执行 2 台天融信设备上的黑名单阻断动作。",
                target_devices: ["FW-HQ-01"],
                target_entities: ["10.10.32.45"],
                execution_mode: "planned",
                related_href: "/war-room"
              }
            ])
        } as Response);
      }

      if (url === "http://localhost:8000/api/collector/statuses") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                collector_id: "collector-hq",
                host: "0.0.0.0",
                port: 514,
                api_ingest_url: "http://localhost:8000/api/events/ingest",
                heartbeat_interval_seconds: 15,
                last_seen_at: "2026-03-24T08:00:00Z",
                online: true
              },
              {
                collector_id: "collector-branch",
                host: "0.0.0.0",
                port: 1514,
                api_ingest_url: "http://localhost:8000/api/events/ingest",
                heartbeat_interval_seconds: 30,
                last_seen_at: "2026-03-24T07:55:00Z",
                online: false
              }
            ])
        } as Response);
      }

      if (url === "http://localhost:8000/api/change-records/change-001/approve") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              record_id: "change-001",
              source: "orchestration",
              title: "全网 TCP 445 横向阻断",
              status: "approved",
              approval_status: "approved",
              summary: "审批通过，可进入策略下发。",
              target_devices: ["FW-HQ-01"],
              target_entities: ["10.10.32.45"],
              execution_mode: "planned",
              related_href: "/orchestration"
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

test("strategy workspace renders devices and control points", async () => {
  render(<StrategyWorkspace />);

  expect(await screen.findByText("策略与设备工作台")).toBeInTheDocument();
  expect(screen.getByText("FW-HQ-01")).toBeInTheDocument();
  expect(screen.getByText("IPS-HQ-01")).toBeInTheDocument();
  expect(screen.getAllByText("AV-BRANCH-01")).toHaveLength(2);
  expect(screen.getByText("1 -> 2")).toBeInTheDocument();
  expect(screen.getByText("审批中变更")).toBeInTheDocument();
  expect(screen.getByText("1 条")).toBeInTheDocument();
  expect(screen.getByText("设备接入健康度")).toBeInTheDocument();
  expect(screen.getByText("未接入日志")).toBeInTheDocument();
  expect(screen.getByText("67%")).toBeInTheDocument();
  expect(screen.getAllByText("1 台").length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText("采集器运行态")).toBeInTheDocument();
  expect(screen.getByText("1 / 2")).toBeInTheDocument();
  expect(screen.getByText("collector-branch")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "查看接入事件" })).toHaveAttribute("href", "/events");
  expect(screen.getByRole("link", { name: "补齐设备录入" })).toHaveAttribute("href", "/compliance");
  expect(screen.getByRole("link", { name: "查看未接入设备事件" })).toHaveAttribute("href", "/events?search=AV-BRANCH-01");
  expect(screen.getByRole("link", { name: "进入 AI 编排" })).toHaveAttribute("href", "/orchestration");
  expect(screen.getByRole("link", { name: "生成变更编排" })).toHaveAttribute("href", "/orchestration");
  expect(screen.getByRole("link", { name: "进入仿真推演" })).toHaveAttribute("href", "/simulation");
  expect(screen.getByText("全网 TCP 445 横向阻断")).toBeInTheDocument();
  expect(screen.getByText("批量下发 445 黑名单阻断")).toBeInTheDocument();
});

test("strategy workspace approves pending change records", async () => {
  const user = userEvent.setup();

  render(<StrategyWorkspace />);

  await screen.findByText("全网 TCP 445 横向阻断");
  await user.click(screen.getByRole("button", { name: "批准变更 change-001" }));

  expect(await screen.findByText("审批通过，可进入策略下发。")).toBeInTheDocument();
  expect(screen.getByText("approved")).toBeInTheDocument();
});

test("strategy workspace highlights targeted device and change record from operations", async () => {
  searchParams = new URLSearchParams("searchDevice=AV-BRANCH-01&recordId=change-001");

  render(<StrategyWorkspace />);

  expect(await screen.findAllByText("定位命中")).toHaveLength(2);
  expect(screen.getByRole("link", { name: "查看未接入设备事件" })).toHaveAttribute(
    "href",
    "/events?search=AV-BRANCH-01"
  );
  expect(screen.getByRole("button", { name: "批准变更 change-001" })).toBeInTheDocument();
});
