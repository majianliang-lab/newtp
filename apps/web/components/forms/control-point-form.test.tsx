import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ControlPointForm } from "./control-point-form";

test("control point form submits a new control point payload", async () => {
  const onCreate = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();

  render(
    <ControlPointForm
      devices={[{ id: 1, device_name: "SEED-FW-01" }]}
      securityDomains={[{ id: 1, name: "默认数据域" }]}
      onCreate={onCreate}
    />
  );

  await user.selectOptions(screen.getByLabelText("关联设备"), "1");
  await user.selectOptions(screen.getByLabelText("源安全域"), "1");
  await user.selectOptions(screen.getByLabelText("目标安全域"), "1");
  await user.click(screen.getByRole("button", { name: "录入控制点" }));

  expect(onCreate).toHaveBeenCalledWith({
    device_id: 1,
    control_type: "boundary_block",
    source_domain_id: 1,
    destination_domain_id: 1,
    supports_simulation: true,
    priority: 100
  });
});
