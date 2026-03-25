import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { SummaryCards } from "./summary-cards";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      if (String(input) !== "http://localhost:8000/api/dashboard/overview") {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({})
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            high_value_asset_count: 12,
            exposure_count: 3,
            log_coverage_rate: 88,
            high_risk_event_count: 2,
            pending_change_count: 4,
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
            executed_change_count: 1,
            recent_changes: [],
            focus: {
              scenario_id: "smb-445-containment",
              title: "445 护网应急推演",
              summary: "窗口内共回放 5 条流量。"
            }
          })
      } as Response);
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("summary cards render platform metrics from dashboard overview api", async () => {
  render(<SummaryCards />);

  expect(await screen.findByText("高价值资产")).toBeInTheDocument();
  expect(screen.getByText("12")).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
  expect(screen.getByText("88%")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.getByText("4")).toBeInTheDocument();
  expect(screen.getByText("Collector 在线")).toBeInTheDocument();
  expect(screen.getByText("2/2")).toBeInTheDocument();
  expect(screen.getByText("待审批变更")).toBeInTheDocument();
});
