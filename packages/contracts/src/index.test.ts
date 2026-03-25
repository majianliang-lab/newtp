import { assetSchema } from "./asset";

test("asset schema exposes security domain ownership", () => {
  expect(assetSchema.shape.securityDomainId).toBeDefined();
});
