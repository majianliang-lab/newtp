import { render, screen } from "@testing-library/react";

import { TopologyCanvas } from "./topology-canvas";

const graphFixture = {
  nodes: [
    { id: "domain-office", type: "domain", label: "办公域", risk: "medium" },
    { id: "domain-data", type: "domain", label: "数据域", risk: "high" }
  ],
  edges: [
    {
      id: "edge-1",
      from: "domain-office",
      to: "domain-data",
      type: "flow",
      label: "TCP/445"
    }
  ]
};

test("renders the security-domain view switcher", () => {
  render(<TopologyCanvas graph={graphFixture} />);

  expect(screen.getByText("安全域视角")).toBeInTheDocument();
});
