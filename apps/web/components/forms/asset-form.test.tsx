import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { AssetForm } from "./asset-form";

test("asset form submits a new asset payload", async () => {
  const onCreate = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();

  render(
    <AssetForm
      protectionObjects={[{ id: 1, name: "默认三级对象" }]}
      securityDomains={[{ id: 1, name: "默认数据域" }]}
      onCreate={onCreate}
    />
  );

  await user.type(screen.getByPlaceholderText("资产名称"), "DC01");
  await user.selectOptions(screen.getByLabelText("所属保护对象"), "1");
  await user.selectOptions(screen.getByLabelText("所属安全域"), "1");
  await user.type(screen.getByPlaceholderText("重要级别"), "5");
  await user.click(screen.getByRole("button", { name: "录入资产" }));

  expect(onCreate).toHaveBeenCalledWith({
    asset_name: "DC01",
    asset_type: "server",
    protection_object_id: 1,
    security_domain_id: 1,
    value_level: 5
  });
});
