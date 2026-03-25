import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, vi } from "vitest";

import { TopologyWorkspace } from "./topology-workspace";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams
}));

beforeEach(() => {
  searchParams = new URLSearchParams();
  const graphMap: Record<string, unknown> = {
    "http://localhost:8000/api/topology/domain-view": {
      nodes: [
        { id: "domain-1", type: "domain", label: "办公域", risk: "medium" },
        { id: "domain-2", type: "domain", label: "数据域", risk: "high" }
      ],
      edges: [
        {
          id: "flow-1",
          from: "domain-1",
          to: "domain-2",
          type: "flow",
          label: "TCP/445",
          flow_type: "east_west",
          protocol: "tcp",
          port: 445,
          risk: "high"
        }
      ]
    },
    "http://localhost:8000/api/topology/asset-view": {
      nodes: [
        { id: "asset-1", type: "asset", label: "SEED-ASSET-01", risk: "medium" },
        { id: "asset-3", type: "asset", label: "10.20.99.45", risk: "medium" },
        { id: "asset-2", type: "asset", label: "10.20.30.15", risk: "high" }
      ],
      edges: [
        {
          id: "flow-1",
          from: "asset-1",
          to: "asset-2",
          type: "flow",
          label: "TCP/445",
          flow_type: "east_west",
          protocol: "tcp",
          port: 445,
          risk: "high"
        }
      ]
    },
    "http://localhost:8000/api/topology/flow-view": {
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
    },
    "http://localhost:8000/api/simulation/replay/smb-445": {
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
        {
          event_type: "policy_hit",
          device_id: "fw-01",
          destination_ip: "10.20.30.15",
          destination_port: 445,
          protocol: "tcp",
          target_asset_node_id: "asset-2",
          target_flow_node_id: "flow-node-1",
          target_edge_id: "flow-1"
        },
        { event_type: "policy_change", device_id: "fw-01" },
        {
          event_type: "ips_alert",
          device_id: "ips-01",
          destination_ip: "10.20.30.15",
          destination_port: 445,
          protocol: "tcp",
          target_asset_node_id: "asset-2",
          target_flow_node_id: "flow-node-1",
          target_edge_id: "flow-1"
        },
        { event_type: "antivirus_alert", device_id: "av-01" }
      ],
      event_type_counts: {
        policy_hit: 1,
        policy_change: 1,
        ips_alert: 1,
        antivirus_alert: 1
      }
    }
  };

  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(graphMap[String(input)])
      } as Response)
    )
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("topology workspace loads graph data from api", async () => {
  render(<TopologyWorkspace />);

  expect(await screen.findByText("办公域")).toBeInTheDocument();
});

test("topology workspace switches to asset view and reloads graph", async () => {
  const user = userEvent.setup();

  render(<TopologyWorkspace />);

  await screen.findByText("办公域");
  await user.click(screen.getByRole("button", { name: "资产视角" }));

  const nodeRegion = await screen.findByRole("region", { name: "拓扑节点" });

  expect(within(nodeRegion).getByText("SEED-ASSET-01")).toBeInTheDocument();
});

test("topology workspace switches to flow view and reloads graph", async () => {
  const user = userEvent.setup();

  render(<TopologyWorkspace />);

  await screen.findByText("办公域");
  await user.click(screen.getByRole("button", { name: "数据流向视角" }));

  const nodeRegion = await screen.findByRole("region", { name: "拓扑节点" });

  expect(within(nodeRegion).getByText("办公域->数据域")).toBeInTheDocument();
});

test("topology workspace shows smb replay panel from api", async () => {
  render(<TopologyWorkspace />);

  expect(await screen.findByText("445 护网应急推演")).toBeInTheDocument();
  expect(screen.getByText("误杀候选 1 条")).toBeInTheDocument();
  expect(screen.getByText("10.20.30.15")).toBeInTheDocument();
  expect(screen.getByText("policy_change")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "定位白名单资产 allow-office-to-file" })).toHaveAttribute(
    "href",
    "/topology?view=asset-view&search=10.20.30.15&targetType=asset&targetLabel=10.20.30.15"
  );
  expect(screen.getByRole("link", { name: "查看事件详情 ips_alert" })).toHaveAttribute(
    "href",
    "/events?search=tcp%20445%2010.20.30.15&targetLabel=10.20.30.15&targetNodeId=flow-node-1&targetEdgeId=flow-1"
  );
});

test("topology workspace filters nodes by search and risk", async () => {
  const user = userEvent.setup();

  render(<TopologyWorkspace />);

  const nodeRegion = await screen.findByRole("region", { name: "拓扑节点" });
  expect(within(nodeRegion).getByText("办公域")).toBeInTheDocument();

  await user.type(screen.getByPlaceholderText("搜索域、资产、设备、端口"), "数据");
  await user.selectOptions(screen.getByLabelText("风险等级筛选"), "high");

  expect(within(nodeRegion).queryByText("办公域")).not.toBeInTheDocument();
  expect(within(nodeRegion).getByText("数据域")).toBeInTheDocument();
});

test("topology workspace shows edge details when key flow is selected", async () => {
  const user = userEvent.setup();

  render(<TopologyWorkspace />);

  await screen.findByText("办公域");
  await user.click(screen.getByRole("button", { name: "查看流向 办公域 到 数据域" }));
  const detailsPanel = screen.getByRole("complementary");

  expect(within(detailsPanel).getByText("流向详情")).toBeInTheDocument();
  expect(within(detailsPanel).getByText("办公域 -> 数据域")).toBeInTheDocument();
  expect(within(detailsPanel).getByText("东西向")).toBeInTheDocument();
  expect(within(detailsPanel).getByText("tcp/445")).toBeInTheDocument();
});

test("topology workspace honors topology pivot params from events workspace", async () => {
  searchParams = new URLSearchParams(
    "view=asset-view&search=10.20&targetType=asset&targetLabel=10.20.99.45&targetNodeId=asset-2"
  );

  render(<TopologyWorkspace />);

  const nodeRegion = await screen.findByRole("region", { name: "拓扑节点" });
  const detailsPanel = screen.getByRole("complementary");
  const flowHitButton = screen.getByRole("button", { name: "查看流向 SEED-ASSET-01 到 10.20.30.15" });

  expect(within(nodeRegion).getByText("10.20.30.15")).toBeInTheDocument();
  expect(within(nodeRegion).getByText("10.20.99.45")).toBeInTheDocument();
  expect(within(nodeRegion).getByText("定位命中")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("搜索域、资产、设备、端口")).toHaveValue("10.20");
  expect(within(detailsPanel).getByText("对象详情")).toBeInTheDocument();
  expect(within(detailsPanel).getByText("10.20.30.15")).toBeInTheDocument();
  expect(within(flowHitButton).getByText("关联命中")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "查看相关事件" })).toHaveAttribute(
    "href",
    "/events?search=10.20.30.15&targetLabel=10.20.30.15&targetNodeId=asset-2"
  );
});

test("topology workspace honors flow-view pivot params from events workspace", async () => {
  searchParams = new URLSearchParams(
    "view=flow-view&search=tcp 445&targetType=flow&targetProtocol=tcp&targetPort=445&targetDestination=10.20.99.45&targetNodeId=flow-node-1"
  );

  render(<TopologyWorkspace />);

  const nodeRegion = await screen.findByRole("region", { name: "拓扑节点" });
  const detailsPanel = screen.getByRole("complementary");

  expect(within(nodeRegion).getByText("办公域->数据域")).toBeInTheDocument();
  expect(within(nodeRegion).getByText("办公域->隔离域")).toBeInTheDocument();
  expect(within(nodeRegion).getByText("定位命中")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("搜索域、资产、设备、端口")).toHaveValue("tcp 445");
  expect(within(detailsPanel).getByText("流向详情")).toBeInTheDocument();
  expect(within(detailsPanel).getByText("办公域->数据域")).toBeInTheDocument();
  expect(within(detailsPanel).getByText("tcp/445")).toBeInTheDocument();
  expect(within(detailsPanel).getByText("东西向")).toBeInTheDocument();
  expect(within(detailsPanel).getByText("OFFICE-PC-01")).toBeInTheDocument();
  expect(within(detailsPanel).getByText("10.20.30.15")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "查看相关事件" })).toHaveAttribute(
    "href",
    "/events?search=tcp%20445%2010.20.30.15&targetLabel=10.20.30.15&targetNodeId=flow-node-1"
  );
});

test("topology workspace honors target edge id for exact edge focus", async () => {
  searchParams = new URLSearchParams("view=asset-view&search=445&targetEdgeId=flow-1");

  render(<TopologyWorkspace />);

  const detailsPanel = await screen.findByRole("complementary");

  expect(within(detailsPanel).getByText("流向详情")).toBeInTheDocument();
  expect(within(detailsPanel).getByText("SEED-ASSET-01 -> 10.20.30.15")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "查看相关事件" })).toHaveAttribute(
    "href",
    "/events?search=tcp%20445%2010.20.30.15&targetLabel=10.20.30.15&targetEdgeId=flow-1"
  );
});
