import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { AccountForm } from "./account-form";

test("account form submits a new account payload", async () => {
  const onCreate = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();

  render(<AccountForm onCreate={onCreate} />);

  await user.type(screen.getByPlaceholderText("账号名称"), "ops_admin");
  await user.selectOptions(screen.getByLabelText("权限级别"), "admin");
  await user.click(screen.getByLabelText("经堡垒机"));
  await user.click(screen.getByLabelText("启用 MFA"));
  await user.click(screen.getByRole("button", { name: "录入账号" }));

  expect(onCreate).toHaveBeenCalledWith({
    account_name: "ops_admin",
    account_type: "human",
    permission_level: "admin",
    via_bastion: true,
    mfa_enabled: true
  });
});
