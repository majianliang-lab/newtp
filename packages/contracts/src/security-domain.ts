import { z } from "zod";

export const securityDomainSchema = z.object({
  id: z.string(),
  protectionObjectId: z.string(),
  name: z.string(),
  type: z.enum(["internet", "dmz", "app", "data", "ops", "office", "audit"]),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).default("medium")
});

export type SecurityDomain = z.infer<typeof securityDomainSchema>;
