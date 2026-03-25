import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { OperationsWorkspace } from "./operations-workspace";

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

      if (url === "http://localhost:8000/api/operations/overview") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                collector_total_count: 2,
                collector_online_count: 1,
                device_total_count: 2,
                connected_device_count: 1,
                disconnected_device_count: 1,
                log_coverage_rate: 50,
                collector_coverage_rate: 50,
                live_event_count: 2,
                high_risk_event_count: 1,
                pending_change_count: 1,
                collector_statuses: [
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
                    host: "10.10.10.20",
                    port: 1514,
                    api_ingest_url: "http://localhost:8000/api/events/ingest",
                    heartbeat_interval_seconds: 30,
                    last_seen_at: "2026-03-24T07:55:00Z",
                    online: false
                  }
                ],
                disconnected_devices: [
                  {
                    id: 2,
                    device_name: "AV-BRANCH-01",
                    vendor: "Topsec",
                    device_type: "av",
                    log_ingest_status: "disconnected",
                    policy_push_capability: false
                  }
                ],
                recent_events: [
                  {
                    id: 1,
                    event_type: "ips_alert",
                    severity: "high",
                    destination_ip: "10.20.1.10"
                  },
                  {
                    id: 2,
                    event_type: "policy_change",
                    severity: "medium",
                    destination_ip: "10.20.1.20"
                  }
                ],
                recent_changes: [
                  {
                    record_id: "change-001",
                    source: "orchestration",
                    title: "全网 TCP 445 横向阻断",
                    status: "pending_approval",
                    related_href: "/orchestration"
                  },
                  {
                    record_id: "change-002",
                    source: "war_room",
                    title: "批量下发 445 黑名单阻断",
                    status: "executed",
                    related_href: "/war-room"
                  }
                ],
                diagnostics: [
                  {
                    category: "collector",
                    title: "collector 离线待处理",
                    summary: "支线 collector 离线，优先检查接入链和网络连通性。",
                    priority: 1,
                    priority_label: "P1",
                    impact_count: 1,
                    scope_label: "collector",
                    action_label: "查看接入事件",
                    action_href: "/events",
                    targets: [
                      {
                        label: "collector-branch",
                        href: "/operations?collectorId=collector-branch"
                      }
                    ]
                  },
                  {
                    category: "device",
                    title: "设备接入待补齐",
                    summary: "仍有 1 台设备未接入日志，建议先补录接入信息再推进策略治理。",
                    priority: 2,
                    priority_label: "P2",
                    impact_count: 1,
                    scope_label: "device",
                    action_label: "补录设备与接入",
                    action_href: "/compliance",
                    targets: [
                      {
                        label: "AV-BRANCH-01",
                        href: "/strategy?searchDevice=AV-BRANCH-01"
                      }
                    ]
                  }
                ],
                diagnostic_groups: [
                  {
                    category: "collector",
                    title: "Collector 异常",
                    items: [
                      {
                        category: "collector",
                        title: "collector 离线待处理",
                        summary: "支线 collector 离线，优先检查接入链和网络连通性。",
                        priority: 1,
                        priority_label: "P1",
                        impact_count: 1,
                        scope_label: "collector",
                        action_label: "查看接入事件",
                        action_href: "/events",
                        targets: [
                          {
                            label: "collector-branch",
                            href: "/operations?collectorId=collector-branch"
                          }
                        ]
                      }
                    ],
                    priority: 1,
                    priority_label: "P1"
                  },
                  {
                    category: "device",
                    title: "设备接入异常",
                    items: [
                      {
                        category: "device",
                        title: "设备接入待补齐",
                        summary: "仍有 1 台设备未接入日志，建议先补录接入信息再推进策略治理。",
                        priority: 2,
                        priority_label: "P2",
                        impact_count: 1,
                        scope_label: "device",
                        action_label: "补录设备与接入",
                        action_href: "/compliance",
                        targets: [
                          {
                            label: "AV-BRANCH-01",
                            href: "/strategy?searchDevice=AV-BRANCH-01"
                          }
                        ]
                      }
                    ],
                    priority: 2,
                    priority_label: "P2"
                  },
                  {
                    category: "event",
                    title: "事件与处置",
                    items: [
                      {
                        category: "event",
                        title: "处理高优先事件",
                        summary: "当前有 1 条高优先事件，建议优先进入事件中心核查证据链。",
                        priority: 1,
                        priority_label: "P1",
                        impact_count: 1,
                        scope_label: "event",
                        action_label: "查看接入事件",
                        action_href: "/events",
                        targets: [
                          {
                            label: "10.20.1.10",
                            href: "/events?search=10.20.1.10&targetLabel=10.20.1.10"
                          },
                          {
                            label: "tcp/445 流向",
                            href: "/topology?view=flow-view&search=tcp%20445%2010.20.1.10&targetType=flow&targetProtocol=tcp&targetPort=445&targetDestination=10.20.1.10"
                          }
                        ]
                      }
                    ],
                    priority: 1,
                    priority_label: "P1"
                  }
                ],
                recommended_actions: [
                  {
                    category: "event",
                    title: "处理高优先事件",
                    summary: "当前有 1 条高优先事件，建议优先进入事件中心核查证据链。",
                    priority: 1,
                    priority_label: "P1",
                    impact_count: 1,
                    scope_label: "event",
                    action_label: "查看接入事件",
                    action_href: "/events",
                    targets: [
                      {
                        label: "10.20.1.10",
                        href: "/events?search=10.20.1.10&targetLabel=10.20.1.10"
                      },
                      {
                        label: "tcp/445 流向",
                        href: "/topology?view=flow-view&search=tcp%20445%2010.20.1.10&targetType=flow&targetProtocol=tcp&targetPort=445&targetDestination=10.20.1.10"
                      }
                    ]
                  },
                  {
                    category: "collector",
                    title: "collector 离线待处理",
                    summary: "支线 collector 离线，优先检查接入链和网络连通性。",
                    priority: 1,
                    priority_label: "P1",
                    impact_count: 1,
                    scope_label: "collector",
                    action_label: "查看接入事件",
                    action_href: "/events",
                    targets: [
                      {
                        label: "collector-branch",
                        href: "/operations?collectorId=collector-branch"
                      }
                    ]
                  },
                  {
                    category: "event",
                    title: "推进待审批变更",
                    summary: "当前仍有 1 条待审批变更，可回到策略工作台继续推进审批。",
                    priority: 3,
                    priority_label: "P3",
                    impact_count: 1,
                    scope_label: "change",
                    action_label: "查看策略审批",
                    action_href: "/strategy",
                    targets: [
                      {
                        label: "全网 TCP 445 横向阻断",
                        href: "/strategy?recordId=change-001"
                      }
                    ]
                  },
                  {
                    category: "device",
                    title: "设备接入待补齐",
                    summary: "仍有 1 台设备未接入日志，建议先补录接入信息再推进策略治理。",
                    priority: 2,
                    priority_label: "P2",
                    impact_count: 1,
                    scope_label: "device",
                    action_label: "补录设备与接入",
                    action_href: "/compliance",
                    targets: [
                      {
                        label: "AV-BRANCH-01",
                        href: "/strategy?searchDevice=AV-BRANCH-01"
                      }
                    ]
                  }
                ]
              }
            ][0])
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

test("operations workspace renders runtime and ingest overview", async () => {
  render(<OperationsWorkspace />);

  expect(await screen.findByText("运行与接入工作台")).toBeInTheDocument();
  expect(screen.getByText("采集器在线")).toBeInTheDocument();
  expect(screen.getByText("1/2")).toBeInTheDocument();
  expect(screen.getByText("设备接入率")).toBeInTheDocument();
  expect(screen.getAllByText("50%")).toHaveLength(2);
  expect(screen.getByText("collector-hq")).toBeInTheDocument();
  expect(screen.getAllByText("collector-branch").length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByText("AV-BRANCH-01").length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText("Collector 异常")).toBeInTheDocument();
  expect(screen.getByText("设备接入异常")).toBeInTheDocument();
  expect(screen.getByText("事件与处置")).toBeInTheDocument();
  expect(screen.getByText("建议优先动作")).toBeInTheDocument();
  expect(screen.getAllByText("P1").length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByText("影响 1 项 / 来源 collector").length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByText("影响 1 项 / 来源 event").length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByText("collector 离线待处理").length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByText("处理高优先事件").length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByText("10.20.1.10").length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByText("tcp/445 流向").length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByText("collector-branch").length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByText("AV-BRANCH-01").length).toBeGreaterThanOrEqual(2);
  expect(
    screen.getAllByText("支线 collector 离线，优先检查接入链和网络连通性。").length
  ).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByText("全网 TCP 445 横向阻断").length).toBeGreaterThanOrEqual(2);
  expect(screen.getByRole("link", { name: "进入监控与事件" })).toHaveAttribute("href", "/events");
  expect(screen.getAllByRole("link", { name: "补录设备与接入" }).length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByRole("link", { name: "查看接入事件" }).length).toBeGreaterThanOrEqual(2);
  expect(screen.getAllByRole("link", { name: "10.20.1.10" })[0]).toHaveAttribute(
    "href",
    "/events?search=10.20.1.10&targetLabel=10.20.1.10"
  );
  expect(screen.getAllByRole("link", { name: "tcp/445 流向" })[0]).toHaveAttribute(
    "href",
    "/topology?view=flow-view&search=tcp%20445%2010.20.1.10&targetType=flow&targetProtocol=tcp&targetPort=445&targetDestination=10.20.1.10"
  );
  expect(screen.getAllByRole("link", { name: "collector-branch" })[0]).toHaveAttribute(
    "href",
    "/operations?collectorId=collector-branch"
  );
  expect(screen.getAllByRole("link", { name: "AV-BRANCH-01" })[0]).toHaveAttribute(
    "href",
    "/strategy?searchDevice=AV-BRANCH-01"
  );
  expect(screen.getByRole("link", { name: "全网 TCP 445 横向阻断" })).toHaveAttribute(
    "href",
    "/strategy?recordId=change-001"
  );
  expect(screen.getByRole("link", { name: "查看设备事件" })).toHaveAttribute(
    "href",
    "/events?search=AV-BRANCH-01"
  );
});

test("operations workspace highlights targeted collector from query params", async () => {
  searchParams = new URLSearchParams("collectorId=collector-branch");

  render(<OperationsWorkspace />);

  expect(await screen.findByText("运行与接入工作台")).toBeInTheDocument();
  expect(screen.getAllByText("定位命中")).toHaveLength(1);
  expect(screen.getAllByRole("link", { name: "collector-branch" })[0]).toHaveAttribute(
    "href",
    "/operations?collectorId=collector-branch"
  );
});
