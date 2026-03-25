import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { SimulationWorkspace } from "./simulation-workspace";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "http://localhost:8000/api/simulation/replay/smb-445") {
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
                impacted_assets: ["10.20.30.15"],
                impacted_asset_refs: [{ label: "10.20.30.15", target_node_id: "asset-2" }],
                whitelist_exception_hits: [],
                false_positive_candidates: [],
                ai_summary: "窗口内共回放 5 条流量。"
              },
              events: [],
              event_type_counts: { policy_hit: 1, policy_change: 1 }
            })
        } as Response);
      }

      if (url === "http://localhost:8000/api/simulation/actions/smb-445") {
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
                  description: "在办公域与服务器域边界设备上批量阻断 SMB 横向流量，并保留白名单例外。",
                  target_devices: ["fw-hq-core-01"],
                  target_entities: ["10.10.32.45"],
                  execution_mode: "planned",
                  priority: "critical",
                  ngtos_intent: "object-group address smb_emergency_blocklist",
                  rollback_hint: "删除地址组并回退策略。"
                }
              ]
            })
        } as Response);
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({})
      } as Response);
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("simulation workspace renders replay and action summaries", async () => {
  render(<SimulationWorkspace />);

  expect(await screen.findByText("仿真与演练中心")).toBeInTheDocument();
  expect(screen.getByText("445 护网应急推演")).toBeInTheDocument();
  expect(screen.getByText("445 护网处置建议")).toBeInTheDocument();
  expect(screen.getByText("批量下发 445 黑名单阻断")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "10.20.30.15" })).toHaveAttribute(
    "href",
    "/topology?view=asset-view&targetNodeId=asset-2&search=10.20.30.15"
  );
  expect(screen.getByRole("link", { name: "进入应急执行" })).toHaveAttribute("href", "/war-room");
  expect(screen.getByRole("link", { name: "交给 AI 编排" })).toHaveAttribute("href", "/orchestration");
  expect(screen.getByRole("link", { name: "进入护网执行" })).toHaveAttribute("href", "/war-room");
  expect(screen.getByRole("link", { name: "生成执行编排" })).toHaveAttribute("href", "/orchestration");
});
