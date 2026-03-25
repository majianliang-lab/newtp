import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ExposureForm } from "./exposure-form";

test("exposure form submits a new exposure payload", async () => {
  const onCreate = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();

  render(<ExposureForm assets={[{ id: 1, asset_name: "SEED-ASSET-01" }]} onCreate={onCreate} />);

  await user.type(screen.getByPlaceholderText("公网 IP"), "1.2.3.4");
  await user.type(screen.getByPlaceholderText("开放端口"), "443");
  await user.selectOptions(screen.getByLabelText("关联资产"), "1");
  await user.click(screen.getByRole("button", { name: "录入暴露面" }));

  expect(onCreate).toHaveBeenCalledWith({
    public_ip: "1.2.3.4",
    open_port: 443,
    protocol: "tcp",
    backend_asset_id: 1,
    security_domain_id: 1,
    log_visibility_status: "visible"
  });
});
