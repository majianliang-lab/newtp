import { z } from "zod";

export const deviceSchema = z.object({
  id: z.string(),
  deviceName: z.string(),
  vendor: z.literal("Topsec"),
  osType: z.literal("NGTOS"),
  deviceType: z.enum(["edge-fw", "interzone-fw", "waf", "bastion", "vpn", "audit"]),
  managementIp: z.string(),
  securityDomainId: z.string(),
  logIngestStatus: z.enum(["connected", "partial", "disconnected"]).default("connected"),
  policyPushCapability: z.boolean().default(true)
});

export type Device = z.infer<typeof deviceSchema>;
