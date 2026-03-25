import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, vi } from "vitest";

import { TemplateCenter } from "./template-center";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

test("template center shows primary entry tabs", async () => {
  render(<TemplateCenter />);

  expect(await screen.findByText("高价值资产")).toBeInTheDocument();
  expect(await screen.findByText("已录入资产")).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: "进入资产与业务" })).toHaveLength(2);
  expect(screen.getAllByRole("link", { name: "进入策略与设备" })).toHaveLength(2);
});

beforeEach(() => {
  let protectionObjects = [{ id: 1, name: "默认三级对象" }];
  let securityDomains = [
    { id: 1, name: "办公域" },
    { id: 2, name: "数据域" }
  ];
  let assets = [
    { id: 1, asset_name: "SEED-ASSET-01" },
    { id: 2, asset_name: "FILE-SRV01" },
    { id: 3, asset_name: "DB-01" }
  ];
  let devices = [{ id: 1, device_name: "SEED-FW-01" }];
  let flows = [
    {
      id: 1,
      source_asset_id: 1,
      destination_asset_id: 2,
      source_domain_id: 1,
      destination_domain_id: 2,
      protocol: "tcp",
      port: 445,
      flow_type: "east_west"
    }
  ];

  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url === "http://localhost:8000/api/assets" && method === "POST") {
        const payload = JSON.parse(String(init?.body)) as {
          asset_name: string;
        };
        const nextAsset = {
          id: assets.length + 1,
          asset_name: payload.asset_name
        };
        assets = [...assets, nextAsset];

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(nextAsset)
        } as Response);
      }

      const map: Record<string, unknown[]> = {
        "http://localhost:8000/api/protection-objects": protectionObjects,
        "http://localhost:8000/api/security-domains": securityDomains,
        "http://localhost:8000/api/assets": assets,
        "http://localhost:8000/api/devices": devices,
        "http://localhost:8000/api/flows": flows
      };

      if (url === "http://localhost:8000/api/compliance/report") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              filing_readiness: 75,
              summary: "备案对象共 8 类，当前已有 6 类完成基础录入。",
              sections: [
                {
                  section_id: "assets",
                  title: "高价值资产",
                  count: assets.length,
                  status: "ready",
                  workspace_href: "/business",
                  sample_items: assets.map((asset) => asset.asset_name).slice(0, 3)
                },
                {
                  section_id: "devices",
                  title: "安全设备",
                  count: devices.length,
                  status: "ready",
                  workspace_href: "/strategy",
                  sample_items: devices.map((device) => device.device_name).slice(0, 3)
                }
              ]
            })
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(map[url] ?? [])
      } as Response);
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("template center loads object counts from api", async () => {
  render(<TemplateCenter />);

  expect(await screen.findByText("已录入资产")).toBeInTheDocument();
  expect(screen.getByText("已纳管设备")).toBeInTheDocument();
});

test("template center shows recent recorded objects", async () => {
  render(<TemplateCenter />);

  const recentSection = await screen.findByRole("region", { name: "最近录入对象" });

  expect(within(recentSection).getByText("DB-01")).toBeInTheDocument();
  expect(within(recentSection).getByText("SEED-FW-01")).toBeInTheDocument();
  expect(within(recentSection).getByText("SEED-ASSET-01 -> FILE-SRV01 tcp/445")).toBeInTheDocument();
  expect(within(recentSection).getByRole("link", { name: "DB-01" })).toHaveAttribute(
    "href",
    "/topology?view=asset-view&targetType=asset&targetLabel=DB-01&search=DB-01"
  );
  expect(within(recentSection).getByRole("link", { name: "SEED-FW-01" })).toHaveAttribute("href", "/strategy");
});

test("template center shows filing summary and export entry", async () => {
  render(<TemplateCenter />);

  const summarySection = await screen.findByRole("region", { name: "备案摘要" });

  expect(within(summarySection).getByText("备案对象共 8 类，当前已有 6 类完成基础录入。")).toBeInTheDocument();
  expect(within(summarySection).getByText("Readiness 75%")).toBeInTheDocument();
  expect(within(summarySection).getByRole("link", { name: "下载备案 JSON" })).toHaveAttribute(
    "href",
    "http://localhost:8000/api/compliance/report"
  );
  expect(within(summarySection).getByRole("link", { name: "查看高价值资产" })).toHaveAttribute("href", "/business");
});

test("template center records recent changes after asset creation", async () => {
  const user = userEvent.setup();

  render(<TemplateCenter />);

  await screen.findByText("模板录入中心");
  const assetSection = screen.getByText("高价值资产录入").closest("section");

  if (!assetSection) {
    throw new Error("asset form section not found");
  }

  await user.type(within(assetSection).getByPlaceholderText("资产名称"), "DC02");
  await user.selectOptions(within(assetSection).getByLabelText("所属保护对象"), "1");
  await user.selectOptions(within(assetSection).getByLabelText("所属安全域"), "1");
  await user.type(within(assetSection).getByPlaceholderText("重要级别"), "5");
  await user.click(within(assetSection).getByRole("button", { name: "录入资产" }));

  const changeSection = await screen.findByRole("region", { name: "最近变更" });
  const recentSection = await screen.findByRole("region", { name: "最近录入对象" });

  expect(within(changeSection).getByText("新增资产 DC02")).toBeInTheDocument();
  expect(within(recentSection).getByText("DC02")).toBeInTheDocument();
});
