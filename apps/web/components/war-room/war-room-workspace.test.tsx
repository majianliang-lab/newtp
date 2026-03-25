import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, vi } from "vitest";

import { WarRoomWorkspace } from "./war-room-workspace";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "http://localhost:8000/api/topology/asset-view") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              nodes: [
                { id: "asset-1", type: "asset", label: "SEED-ASSET-01", risk: "medium" },
                { id: "asset-2", type: "asset", label: "10.20.30.15", risk: "high" },
                { id: "asset-3", type: "asset", label: "10.20.99.45", risk: "medium" }
              ],
              edges: []
            })
        } as Response);
      }

      if (String(input) === "http://localhost:8000/api/topology/flow-view") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              nodes: [
                {
                  id: "flow-node-1",
                  type: "flow",
                  label: "办公域->数据域",
                  risk: "high",
                  flow_type: "east_west",
                  protocol: "tcp",
                  port: 445,
                  source_asset_label: "OFFICE-PC-01",
                  destination_asset_label: "10.20.30.15"
                },
                {
                  id: "flow-node-2",
                  type: "flow",
                  label: "办公域->隔离域",
                  risk: "high",
                  flow_type: "east_west",
                  protocol: "tcp",
                  port: 445,
                  source_asset_label: "OFFICE-PC-02",
                  destination_asset_label: "10.20.99.45"
                }
              ],
              edges: []
            })
        } as Response);
      }

      if (String(input) === "http://localhost:8000/api/simulation/actions/smb-445") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              scenario_id: "smb-445-containment",
              title: "445 护网处置建议",
              actions: [
                {
                  action_id: "action-blacklist-block-01",
                  action_type: "blacklist_block",
                  title: "批量下发 445 黑名单阻断",
                  description: "在办公域与服务器域边界批量阻断 SMB 横向流量。",
                  target_devices: ["fw-hq-core-01", "fw-branch-01"],
                  target_entities: ["10.10.32.45", "10.20.99.45"],
                  execution_mode: "planned",
                  priority: "critical",
                  ngtos_intent:
                    "object-group address smb_emergency_blocklist\n network-object 10.10.32.45\n policy interzone deny_smb_blocklist",
                  rollback_hint: "删除地址组 smb_emergency_blocklist 并回退 deny_smb_blocklist 策略。"
                },
                {
                  action_id: "action-host-isolation-01",
                  action_type: "host_isolation",
                  title: "隔离感染主机 10.10.32.45",
                  description: "仅保留与 EDR 管控中心通信，其余流量全部拒绝。",
                  target_devices: ["fw-hq-core-01"],
                  target_entities: ["10.10.32.45"],
                  execution_mode: "planned",
                  priority: "critical",
                  ngtos_intent:
                    "object address infected_host_10_10_32_45\n host 10.10.32.45\n policy interzone isolate_infected_host deny",
                  rollback_hint: "删除 infected_host_10_10_32_45 对象并撤销 isolate_infected_host 策略。"
                }
              ]
            })
        } as Response);
      }

      if (String(input) === "http://localhost:8000/api/simulation/actions/smb-445/execute") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              action_id: "action-blacklist-block-01",
              status: "executed",
              executed_device_count: 2,
              generated_event_types: ["policy_change", "policy_hit"],
              summary: "已模拟执行 2 台天融信设备上的黑名单阻断动作。"
            })
        } as Response);
      }

      if (String(input) !== "http://localhost:8000/api/simulation/replay/smb-445") {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({})
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            scenario_id: "smb-445-containment",
            title: "445 护网应急推演",
            stats: {
              permit_count: 3,
              deny_count: 2,
              implicit_deny_count: 1,
              false_positive_candidates: 1,
              policy_change_count: 1,
              security_event_count: 2
            },
            evidence: {
              impacted_assets: ["10.20.30.15", "10.20.99.45"],
              whitelist_exception_hits: [
                {
                  flow_id: "baseline-file-share-01",
                  policy_id: "allow-office-to-file",
                  destination_ip: "10.20.30.15",
                  source_ip: "10.10.32.15",
                  port: 445
                }
              ],
              false_positive_candidates: [
                {
                  flow_id: "baseline-denied-445",
                  destination_ip: "10.20.99.45",
                  source_ip: "10.10.88.12",
                  policy_id: "implicit-deny",
                  port: 445
                }
              ],
              ai_summary: "窗口内共回放 5 条流量，允许 3 条，阻断 2 条，误杀候选 1 条。"
            },
            events: [
              { event_type: "policy_hit", device_id: "fw-01" },
              { event_type: "policy_change", device_id: "fw-01" },
              { event_type: "ips_alert", device_id: "ips-01" },
              { event_type: "antivirus_alert", device_id: "av-01" }
            ],
            event_type_counts: {
              policy_hit: 1,
              policy_change: 1,
              ips_alert: 1,
              antivirus_alert: 1
            }
          })
      } as Response);
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("war room workspace renders replay stats and event distribution", async () => {
  render(<WarRoomWorkspace />);

  expect(await screen.findByText("445 护网应急推演")).toBeInTheDocument();
  expect(screen.getByText("误杀候选 1 条")).toBeInTheDocument();
  expect(screen.getByText("policy_change")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "定位到拓扑 10.20.99.45" })).toBeInTheDocument();
});

test("war room workspace renders recommended response actions", async () => {
  render(<WarRoomWorkspace />);

  expect(await screen.findByText("批量下发 445 黑名单阻断")).toBeInTheDocument();
  expect(screen.getByText("隔离感染主机 10.10.32.45")).toBeInTheDocument();
  expect(screen.getByText("fw-hq-core-01, fw-branch-01")).toBeInTheDocument();
  expect(screen.getByText(/object-group address smb_emergency_blocklist/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "定位处置对象 10.20.99.45" })).toHaveAttribute(
    "href",
    "/topology?view=asset-view&search=10.20.99.45&targetType=asset&targetLabel=10.20.99.45&targetNodeId=asset-3"
  );
});

test("war room workspace executes a response action and shows receipt", async () => {
  const user = userEvent.setup();

  render(<WarRoomWorkspace />);

  await screen.findByText("批量下发 445 黑名单阻断");
  await user.click(screen.getByRole("button", { name: "执行动作 action-blacklist-block-01" }));

  expect(await screen.findByText("执行完成")).toBeInTheDocument();
  expect(screen.getByText("已模拟执行 2 台天融信设备上的黑名单阻断动作。")).toBeInTheDocument();
});

test("war room workspace exposes topology and event pivots for replay evidence", async () => {
  render(<WarRoomWorkspace />);

  const assetLink = await screen.findByRole("link", { name: "定位到拓扑 10.20.30.15" });
  const flowLink = screen.getByRole("link", { name: "定位误杀流向 baseline-denied-445" });
  const eventLink = screen.getByRole("link", { name: "查看误杀事件 baseline-denied-445" });

  expect(assetLink).toHaveAttribute(
    "href",
    "/topology?view=asset-view&search=10.20.30.15&targetType=asset&targetLabel=10.20.30.15&targetNodeId=asset-2"
  );
  expect(flowLink).toHaveAttribute(
    "href",
    "/topology?view=flow-view&search=tcp%20445%2010.20.99.45&targetType=flow&targetProtocol=tcp&targetPort=445&targetDestination=10.20.99.45&targetNodeId=flow-node-2"
  );
  expect(eventLink).toHaveAttribute("href", "/events?search=10.20.99.45&targetLabel=10.20.99.45");
});

test("war room workspace consumes topology target refs embedded in replay payload", async () => {
  const fetchSpy = vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "http://localhost:8000/api/simulation/actions/smb-445") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              scenario_id: "smb-445-containment",
              title: "445 护网处置建议",
              actions: []
            })
        } as Response);
      }

      if (String(input) === "http://localhost:8000/api/simulation/replay/smb-445") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              scenario_id: "smb-445-containment",
              title: "445 护网应急推演",
              stats: {
                permit_count: 3,
                deny_count: 2,
                implicit_deny_count: 1,
                false_positive_candidates: 1,
                policy_change_count: 1,
                security_event_count: 2
              },
              evidence: {
                impacted_assets: ["10.20.30.15", "10.20.99.45"],
                impacted_asset_refs: [
                  { label: "10.20.30.15", target_node_id: "asset-2" },
                  { label: "10.20.99.45", target_node_id: "asset-3" }
                ],
                whitelist_exception_hits: [
                  {
                    flow_id: "baseline-file-share-01",
                    policy_id: "allow-office-to-file",
                    destination_ip: "10.20.30.15",
                    source_ip: "10.10.32.15",
                    port: 445,
                    target_asset_node_id: "asset-2",
                    target_flow_node_id: "flow-node-1",
                    target_edge_id: "flow-1"
                  }
                ],
                false_positive_candidates: [
                  {
                    flow_id: "baseline-denied-445",
                    destination_ip: "10.20.99.45",
                    source_ip: "10.10.88.12",
                    policy_id: "implicit-deny",
                    port: 445,
                    target_asset_node_id: "asset-3",
                    target_flow_node_id: "flow-node-2",
                    target_edge_id: "flow-2"
                  }
                ],
                ai_summary: "窗口内共回放 5 条流量，允许 3 条，阻断 2 条，误杀候选 1 条。"
              },
              events: [
                { event_type: "policy_hit", device_id: "fw-01" },
                { event_type: "policy_change", device_id: "fw-01" },
                { event_type: "ips_alert", device_id: "ips-01" },
                { event_type: "antivirus_alert", device_id: "av-01" }
              ],
              event_type_counts: {
                policy_hit: 1,
                policy_change: 1,
                ips_alert: 1,
                antivirus_alert: 1
              }
            })
        } as Response);
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({})
      } as Response);
    });
  vi.stubGlobal("fetch", fetchSpy);

  render(<WarRoomWorkspace />);

  expect(await screen.findByRole("link", { name: "定位到拓扑 10.20.30.15" })).toHaveAttribute(
    "href",
    "/topology?view=asset-view&search=10.20.30.15&targetType=asset&targetLabel=10.20.30.15&targetNodeId=asset-2"
  );
  expect(screen.getByRole("link", { name: "定位误杀流向 baseline-denied-445" })).toHaveAttribute(
    "href",
    "/topology?view=flow-view&search=tcp%20445%2010.20.99.45&targetType=flow&targetProtocol=tcp&targetPort=445&targetDestination=10.20.99.45&targetNodeId=flow-node-2&targetEdgeId=flow-2"
  );
  expect(screen.getByRole("link", { name: "查看误杀事件 baseline-denied-445" })).toHaveAttribute(
    "href",
    "/events?search=10.20.99.45&targetLabel=10.20.99.45&targetNodeId=flow-node-2&targetEdgeId=flow-2"
  );
  expect(fetchSpy.mock.calls.map(([input]) => String(input))).not.toContain("http://localhost:8000/api/topology/asset-view");
  expect(fetchSpy.mock.calls.map(([input]) => String(input))).not.toContain("http://localhost:8000/api/topology/flow-view");
});
