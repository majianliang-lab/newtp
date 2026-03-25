import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { vi } from "vitest";

import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/topology"
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({})
      } as Response)
    )
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("renders global navigation for the platform", () => {
  render(<AppShell>content</AppShell>);

  expect(screen.getByText("动态拓扑中心")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "AI 编排中心" })).toHaveAttribute("href", "/orchestration");
  expect(screen.getByRole("link", { name: "运行与接入" })).toHaveAttribute("href", "/operations");
  expect(screen.getByRole("link", { name: "监控与事件" })).toHaveAttribute("href", "/events");
});
