import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { FlowForm } from "./flow-form";

test("flow form submits a new flow payload", async () => {
  const onCreate = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();

  render(
    <FlowForm
      assets={[
        { id: 1, asset_name: "SEED-ASSET-01" },
        { id: 2, asset_name: "DB-01" }
      ]}
      securityDomains={[
        { id: 1, name: "办公域" },
        { id: 2, name: "数据域" }
      ]}
      onCreate={onCreate}
    />
  );

  await user.selectOptions(screen.getByLabelText("源资产"), "1");
  await user.selectOptions(screen.getByLabelText("源安全域"), "1");
  await user.selectOptions(screen.getByLabelText("目标资产"), "2");
  await user.selectOptions(screen.getByLabelText("目标安全域"), "2");
  await user.type(screen.getByPlaceholderText("端口"), "445");
  await user.selectOptions(screen.getByLabelText("流向类型"), "east_west");
  await user.click(screen.getByRole("button", { name: "录入流向" }));

  expect(onCreate).toHaveBeenCalledWith({
    source_asset_id: 1,
    source_domain_id: 1,
    destination_asset_id: 2,
    destination_domain_id: 2,
    protocol: "tcp",
    port: 445,
    flow_type: "east_west"
  });
});
