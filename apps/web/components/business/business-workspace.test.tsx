import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { BusinessWorkspace } from "./business-workspace";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "http://localhost:8000/api/assets") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, asset_name: "ERP-CORE-01", asset_type: "server", protection_object_id: 1, security_domain_id: 1, value_level: 5 },
              { id: 2, asset_name: "CRM-APP-01", asset_type: "server", protection_object_id: 1, security_domain_id: 1, value_level: 4 }
            ])
        } as Response);
      }

      if (url === "http://localhost:8000/api/flows") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, source_asset_id: 1, source_domain_id: 1, destination_asset_id: 2, destination_domain_id: 1, protocol: "tcp", port: 443, flow_type: "east_west" }
            ])
        } as Response);
      }

      if (url === "http://localhost:8000/api/exposures") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, public_ip: "203.0.113.10", open_port: 443, protocol: "tcp", backend_asset_id: 2, security_domain_id: 1, log_visibility_status: "connected" }
            ])
        } as Response);
      }

      if (url === "http://localhost:8000/api/accounts") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, account_name: "ops_admin", account_type: "admin", permission_level: "high", via_bastion: true, mfa_enabled: true }
            ])
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

test("business workspace renders assets, flows, exposures and accounts", async () => {
  render(<BusinessWorkspace />);

  expect(await screen.findByText("资产与业务工作台")).toBeInTheDocument();
  expect(screen.getByText("ERP-CORE-01")).toBeInTheDocument();
  expect(screen.getByText("CRM-APP-01")).toBeInTheDocument();
  expect(screen.getByText("203.0.113.10")).toBeInTheDocument();
  expect(screen.getByText("ops_admin")).toBeInTheDocument();
  expect(screen.getByText("443 / east_west")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "进入资产拓扑" })).toHaveAttribute("href", "/topology?view=asset-view");
  expect(screen.getAllByRole("link", { name: "定位到拓扑" })).toHaveLength(2);
  expect(screen.getByRole("link", { name: "查看相关事件" })).toHaveAttribute(
    "href",
    "/events?search=203.0.113.10%20443"
  );
});
