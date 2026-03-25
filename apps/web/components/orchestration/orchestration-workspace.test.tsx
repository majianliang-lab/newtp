import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, vi } from "vitest";

import { OrchestrationWorkspace } from "./orchestration-workspace";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) !== "http://localhost:8000/api/orchestration/simulate") {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({})
        } as Response);
      }

      expect(init?.method).toBe("POST");
      expect(init?.body).toBeTruthy();

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            intent: {
              action: "block",
              scope: "global",
              protocol: "tcp",
              port: 445,
              objective: "防止勒索病毒扩散",
              scenario: "smb-445-containment"
            },
            replay: {
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
                false_positive_reasons: [
                  "对 10.20.30.15 的访问属于允许窗口内的文件共享，不应按异常处置。"
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
                    target_edge_id: "flow-1",
                    whitelist_reason: "文件共享白名单仍在生效，保留以避免办公到文件服务器误杀。"
                  }
                ],
                false_positive_candidates: [],
                ai_summary: "窗口内共回放 5 条流量，允许 3 条，阻断 2 条，误杀候选 1 条。"
              },
              events: [],
              event_type_counts: {
                policy_hit: 1,
                policy_change: 1,
                ips_alert: 1,
                antivirus_alert: 1
              }
            },
            recommended_actions: [
              {
                action_id: "action-blacklist-block-01",
                action_type: "blacklist_block",
                title: "批量下发 445 黑名单阻断",
                description: "在办公域与服务器域边界设备上批量阻断 SMB 横向流量，并保留白名单例外。",
                target_devices: ["fw-hq-core-01", "fw-branch-01"],
                target_entities: ["10.10.32.45", "10.20.30.15"],
                execution_mode: "planned",
                priority: "critical",
                ngtos_intent: "object-group address smb_emergency_blocklist",
                rollback_hint: "删除地址组并回退策略。"
              }
            ],
            approval_state: {
              status: "pending_approval",
              required_roles: ["SOC 值班主管", "网络安全平台主管"],
              rationale: "当前动作涉及跨域批量阻断，需要先复核误杀候选与白名单例外。",
              impact_summary: "审批通过后将影响 2 台边界设备策略命中。"
            },
            explanation_chain: [
              "已识别为全网 445 横向阻断意图。",
              "回放显示存在误杀候选，需要保留 allow-office-to-file 例外。",
              "建议先审批后批量下发阻断策略，再观察实时事件。"
            ],
            execution_plan: [
              {
                step_id: "review-exceptions",
                title: "复核白名单与误杀候选",
                owner: "SOC 值班主管",
                status: "in_review",
                summary: "先确认 allow-office-to-file 等例外仍需保留。",
                impact_summary: "若移除例外，办公文件共享会被同步阻断。"
              },
              {
                step_id: "push-policy",
                title: "下发阻断策略",
                owner: "网络安全平台主管",
                status: "ready",
                summary: "审批通过后向边界设备批量下发 445 阻断策略。",
                impact_summary: "下发后边界阻断生效，预计覆盖 2 台设备。"
              }
            ],
            recommended_exceptions: [
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
            ]
          })
      } as Response);
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("orchestration workspace simulates an intent and renders recommendations", async () => {
  const user = userEvent.setup();

  render(<OrchestrationWorkspace />);

  expect(screen.getByText("AI 编排中心")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "生成编排建议" }));

  expect(await screen.findByText("批量下发 445 黑名单阻断")).toBeInTheDocument();
  expect(screen.getByText("smb-445-containment")).toBeInTheDocument();
  expect(screen.getByText("阻断 / global / tcp/445")).toBeInTheDocument();
  expect(screen.getAllByText("allow-office-to-file")).toHaveLength(2);
  expect(await screen.findByText("1. 对 10.20.30.15 的访问属于允许窗口内的文件共享，不应按异常处置。")).toBeInTheDocument();
  expect(
    await screen.findByText("文件共享白名单仍在生效，保留以避免办公到文件服务器误杀。")
  ).toBeInTheDocument();
  expect(await screen.findByText("审批通过后将影响 2 台边界设备策略命中。")).toBeInTheDocument();
  expect(await screen.findByText("执行影响：若移除例外，办公文件共享会被同步阻断。")).toBeInTheDocument();
  expect(screen.getByText("fw-hq-core-01, fw-branch-01")).toBeInTheDocument();
  expect(screen.getByText("10.20.30.15, 10.20.99.45")).toBeInTheDocument();
  expect(screen.getByText("pending_approval")).toBeInTheDocument();
  expect(screen.getByText("SOC 值班主管, 网络安全平台主管")).toBeInTheDocument();
  expect(screen.getByText("3. 建议先审批后批量下发阻断策略，再观察实时事件。")).toBeInTheDocument();
  expect(screen.getByText("复核白名单与误杀候选")).toBeInTheDocument();
  expect(screen.getByText("下发阻断策略")).toBeInTheDocument();

  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === "http://localhost:8000/api/orchestration/submit") {
        expect(init?.method).toBe("POST");
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              record_id: "change-001",
              source: "orchestration",
              title: "全网 TCP 445 横向阻断",
              status: "pending_approval",
              approval_status: "pending_approval",
              summary: "已提交审批，等待 SOC 值班主管和网络安全平台主管确认。",
              target_devices: ["fw-hq-core-01", "fw-branch-01"],
              target_entities: ["10.10.32.45"],
              execution_mode: "planned",
              related_href: "/strategy"
            })
        } as Response);
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({})
      } as Response);
    })
  );

  await user.click(screen.getByRole("button", { name: "提交审批流" }));

  expect(await screen.findByText("已提交审批，等待 SOC 值班主管和网络安全平台主管确认。")).toBeInTheDocument();
  expect(screen.getByText("记录编号 change-001")).toBeInTheDocument();
});

test("orchestration workspace renders request errors", async () => {
  const user = userEvent.setup();

  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({})
      } as Response)
    )
  );

  render(<OrchestrationWorkspace />);

  await user.click(screen.getByRole("button", { name: "生成编排建议" }));

  expect(await screen.findByText("编排请求失败，请稍后重试。")).toBeInTheDocument();
});
