import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { EventsWorkspace } from "./events-workspace";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams
}));

beforeEach(() => {
  searchParams = new URLSearchParams();
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "http://localhost:8000/api/events/live") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        } as Response);
      }

      if (String(input) === "http://localhost:8000/api/collector/statuses") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
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
            ])
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
              { event_type: "policy_hit", device_id: "fw-01", severity: "info" },
              { event_type: "policy_change", device_id: "fw-01", severity: "medium" },
              { event_type: "ips_alert", device_id: "ips-01", severity: "critical" },
              { event_type: "antivirus_alert", device_id: "av-01", severity: "high" }
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

test("events workspace renders event stream and key indicators", async () => {
  render(<EventsWorkspace />);

  expect(await screen.findByText("监控与事件工作台")).toBeInTheDocument();
  expect(screen.getByText("collector-local-01")).toBeInTheDocument();
  expect(screen.getByText("collector-branch-02")).toBeInTheDocument();
  expect(screen.getByText("2/2 在线")).toBeInTheDocument();
  expect(screen.getAllByText("在线").length).toBeGreaterThan(0);
  expect(screen.getByText("高优先事件流")).toBeInTheDocument();
  expect(screen.getByText("ips_alert")).toBeInTheDocument();
  expect(screen.getByText("antivirus_alert")).toBeInTheDocument();
  expect(screen.getByText("10.20.99.45")).toBeInTheDocument();
});

test("events workspace prefers live event stream when api returns ingested events", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "http://localhost:8000/api/events/live") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                event_type: "ips_alert",
                device_id: "ips-hq-01",
                severity: "critical",
                destination_ip: "10.20.30.15",
                destination_port: 445
              },
              {
                event_type: "policy_change",
                device_id: "fw-hq-01",
                severity: "medium"
              }
            ])
        } as Response);
      }

      if (String(input) === "http://localhost:8000/api/collector/statuses") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
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
            ])
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
              impacted_assets: ["10.20.99.45"],
              whitelist_exception_hits: [],
              false_positive_candidates: [],
              ai_summary: "窗口内共回放 5 条流量。"
            },
            events: [],
            event_type_counts: {}
          })
      } as Response);
    })
  );

  render(<EventsWorkspace />);

  expect(await screen.findByText("live-event-stream")).toBeInTheDocument();
  expect(screen.getByText("collector-local-01")).toBeInTheDocument();
  expect(screen.getByText("collector-branch-02")).toBeInTheDocument();
  expect(screen.getByText("2/2 在线")).toBeInTheDocument();
  expect(screen.getByText("ips_alert")).toBeInTheDocument();
  expect(screen.getByText("ips-hq-01")).toBeInTheDocument();
  expect(screen.getByText("10.20.30.15")).toBeInTheDocument();
});

test("events workspace exposes topology pivot links for impacted assets", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "http://localhost:8000/api/events/live") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                event_type: "ips_alert",
                device_id: "ips-hq-01",
                severity: "critical",
                destination_ip: "10.20.30.15",
                destination_port: 445,
                target_asset_node_id: "asset-2",
                target_edge_id: "flow-1"
              }
            ])
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
              impacted_assets: ["10.20.99.45"],
              whitelist_exception_hits: [],
              false_positive_candidates: [],
              ai_summary: "窗口内共回放 5 条流量。"
            },
            events: [],
            event_type_counts: {}
          })
      } as Response);
    })
  );

  render(<EventsWorkspace />);

  const topologyLink = await screen.findByRole("link", { name: "定位到拓扑 10.20.30.15" });

  expect(topologyLink).toHaveAttribute(
    "href",
    "/topology?view=asset-view&search=10.20.30.15&targetType=asset&targetLabel=10.20.30.15&targetNodeId=asset-2&targetEdgeId=flow-1"
  );
});

test("events workspace exposes flow-view pivot links for high priority events", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "http://localhost:8000/api/events/live") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                event_type: "ips_alert",
                device_id: "ips-hq-01",
                severity: "critical",
                destination_ip: "10.20.30.15",
                destination_port: 445,
                protocol: "tcp",
                target_flow_node_id: "flow-node-1",
                target_edge_id: "flow-1"
              }
            ])
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
              impacted_assets: [],
              whitelist_exception_hits: [],
              false_positive_candidates: [],
              ai_summary: "窗口内共回放 5 条流量。"
            },
            events: [],
            event_type_counts: {}
          })
      } as Response);
    })
  );

  render(<EventsWorkspace />);

  const flowPivotLink = await screen.findByRole("link", { name: "查看关联流向 ips_alert" });

  expect(flowPivotLink).toHaveAttribute(
    "href",
    "/topology?view=flow-view&search=tcp%20445%2010.20.30.15&targetType=flow&targetProtocol=tcp&targetPort=445&targetDestination=10.20.30.15&targetNodeId=flow-node-1&targetEdgeId=flow-1"
  );
});

test("events workspace honors evidence pivot params from topology details", async () => {
  searchParams = new URLSearchParams(
    "search=tcp 445 10.20.30.15&targetLabel=10.20.30.15&targetNodeId=flow-node-1&targetEdgeId=flow-1"
  );

  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "http://localhost:8000/api/events/live") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                event_type: "ips_alert",
                device_id: "ips-hq-01",
                severity: "critical",
                destination_ip: "10.20.30.15",
                destination_port: 445,
                protocol: "tcp"
              },
              {
                event_type: "antivirus_alert",
                device_id: "av-hq-01",
                severity: "high",
                destination_ip: "10.20.99.45",
                destination_port: 445,
                protocol: "tcp"
              }
            ])
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
              impacted_assets: [],
              whitelist_exception_hits: [],
              false_positive_candidates: [],
              ai_summary: "窗口内共回放 5 条流量。"
            },
            events: [],
            event_type_counts: {}
          })
      } as Response);
    })
  );

  render(<EventsWorkspace />);

  expect(await screen.findByText("ips_alert")).toBeInTheDocument();
  expect(screen.getByText("定位命中")).toBeInTheDocument();
  expect(screen.queryByText("antivirus_alert")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "查看关联流向 ips_alert" })).toHaveAttribute(
    "href",
    "/topology?view=flow-view&search=tcp%20445%2010.20.30.15&targetType=flow&targetProtocol=tcp&targetPort=445&targetDestination=10.20.30.15&targetNodeId=flow-node-1&targetEdgeId=flow-1"
  );
});

test("events workspace preserves target edge id on asset pivot links", async () => {
  searchParams = new URLSearchParams("search=10.20.30.15&targetLabel=10.20.30.15&targetEdgeId=flow-1");

  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "http://localhost:8000/api/events/live") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                event_type: "ips_alert",
                device_id: "ips-hq-01",
                severity: "critical",
                destination_ip: "10.20.30.15",
                destination_port: 445,
                protocol: "tcp"
              }
            ])
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
              impacted_assets: [],
              whitelist_exception_hits: [],
              false_positive_candidates: [],
              ai_summary: "窗口内共回放 5 条流量。"
            },
            events: [],
            event_type_counts: {}
          })
      } as Response);
    })
  );

  render(<EventsWorkspace />);

  expect(await screen.findByRole("link", { name: "定位到拓扑 10.20.30.15" })).toHaveAttribute(
    "href",
    "/topology?view=asset-view&search=10.20.30.15&targetType=asset&targetLabel=10.20.30.15&targetEdgeId=flow-1"
  );
});

test("events workspace focuses the exact matching event by target edge id", async () => {
  searchParams = new URLSearchParams("search=10.20.30.15&targetLabel=10.20.30.15&targetEdgeId=flow-2");

  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "http://localhost:8000/api/events/live") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                event_type: "ips_alert",
                device_id: "ips-hq-01",
                severity: "critical",
                destination_ip: "10.20.30.15",
                destination_port: 445,
                protocol: "tcp",
                target_edge_id: "flow-1"
              },
              {
                event_type: "antivirus_alert",
                device_id: "av-hq-01",
                severity: "high",
                destination_ip: "10.20.30.15",
                target_edge_id: "flow-2"
              }
            ])
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
              impacted_assets: [],
              whitelist_exception_hits: [],
              false_positive_candidates: [],
              ai_summary: "窗口内共回放 5 条流量。"
            },
            events: [],
            event_type_counts: {}
          })
      } as Response);
    })
  );

  render(<EventsWorkspace />);

  expect(await screen.findByText("antivirus_alert")).toBeInTheDocument();
  expect(screen.getAllByText("定位命中")).toHaveLength(1);

  const antivirusCard = screen.getByText("antivirus_alert").closest("article");

  expect(antivirusCard).toHaveTextContent("定位命中");
  expect(screen.queryByText("ips_alert")).not.toBeInTheDocument();
});

test("events workspace filters to the exact matching event by target edge id", async () => {
  searchParams = new URLSearchParams("search=10.20.30.15&targetLabel=10.20.30.15&targetEdgeId=flow-2");

  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      if (String(input) === "http://localhost:8000/api/events/live") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                event_type: "ips_alert",
                device_id: "ips-hq-01",
                severity: "critical",
                destination_ip: "10.20.30.15",
                destination_port: 445,
                protocol: "tcp",
                target_edge_id: "flow-1"
              },
              {
                event_type: "antivirus_alert",
                device_id: "av-hq-01",
                severity: "high",
                destination_ip: "10.20.30.15",
                target_edge_id: "flow-2"
              }
            ])
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
              impacted_assets: [],
              whitelist_exception_hits: [],
              false_positive_candidates: [],
              ai_summary: "窗口内共回放 5 条流量。"
            },
            events: [],
            event_type_counts: {}
          })
      } as Response);
    })
  );

  render(<EventsWorkspace />);

  expect(await screen.findByText("antivirus_alert")).toBeInTheDocument();
  expect(screen.queryByText("ips_alert")).not.toBeInTheDocument();
});
