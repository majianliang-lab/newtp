import { render, screen } from "@testing-library/react";

import { TopologyCanvas } from "./topology-canvas";

const graphFixture = {
  nodes: [
    {
      id: "domain-office",
      type: "domain",
      label: "办公域",
      risk: "medium",
      metadata: {
        owner_group: "办公平台",
        classification: "内部办公域"
      }
    },
    { id: "domain-data", type: "domain", label: "数据域", risk: "high" }
  ],
  edges: [
    {
      id: "edge-1",
      from: "domain-office",
      to: "domain-data",
      type: "flow",
      label: "TCP/445",
      key_flows: [
        {
          id: "key-flow-1",
          label: "办公域到数据域的文件共享",
          source_asset_label: "OFFICE-PC-01",
          destination_asset_label: "10.20.30.15",
          protocol: "tcp",
          port: 445
        }
      ]
    }
  ]
};

test("renders the security-domain view switcher", () => {
  render(<TopologyCanvas graph={graphFixture} />);

  expect(screen.getByText("安全域视角")).toBeInTheDocument();
});

test("shows enriched metadata for the selected domain node", () => {
  render(<TopologyCanvas graph={graphFixture} />);

  const detailsPanel = screen.getByRole("complementary");

  expect(detailsPanel).toHaveTextContent("办公平台");
  expect(detailsPanel).toHaveTextContent("内部办公域");
});

test("shows key-flow entries from edge payloads", () => {
  render(<TopologyCanvas graph={graphFixture} activeView="flow-view" />);

  expect(screen.getByRole("button", { name: "查看流向 办公域 到 数据域" })).toHaveTextContent(
    "办公域到数据域的文件共享"
  );
});
