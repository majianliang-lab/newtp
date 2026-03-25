import { z } from "zod";

export const assetSchema = z.object({
  id: z.string(),
  assetName: z.string(),
  assetType: z.enum(["server", "database", "domain-controller", "bastion", "firewall", "application"]),
  protectionObjectId: z.string(),
  securityDomainId: z.string(),
  businessSystemId: z.string().optional(),
  valueLevel: z.number().min(1).max(5),
  isInternetExposed: z.boolean().default(false),
  managementEntry: z.string().optional()
});

export type Asset = z.infer<typeof assetSchema>;
