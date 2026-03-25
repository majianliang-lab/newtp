import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { DeviceForm } from "./device-form";

test("device form submits a new device payload", async () => {
  const onCreate = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();

  render(
    <DeviceForm
      securityDomains={[{ id: 1, name: "默认数据域" }]}
      onCreate={onCreate}
    />
  );

  await user.type(screen.getByPlaceholderText("设备名称"), "fw-hq-core-01");
  await user.type(screen.getByPlaceholderText("管理 IP"), "10.255.0.11");
  await user.selectOptions(screen.getByLabelText("所属安全域"), "1");
  await user.click(screen.getByRole("button", { name: "录入设备" }));

  expect(onCreate).toHaveBeenCalledWith({
    device_name: "fw-hq-core-01",
    vendor: "Topsec",
    os_type: "NGTOS",
    device_type: "edge-fw",
    management_ip: "10.255.0.11",
    security_domain_id: 1,
    log_ingest_status: "connected",
    policy_push_capability: true
  });
});
