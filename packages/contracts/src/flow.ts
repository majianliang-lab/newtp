import { z } from "zod";

export const flowSchema = z.object({
  id: z.string(),
  sourceAssetId: z.string(),
  sourceDomainId: z.string(),
  destinationAssetId: z.string(),
  destinationDomainId: z.string(),
  protocol: z.enum(["tcp", "udp", "icmp"]),
  port: z.number(),
  flowType: z.enum([
    "north_south",
    "east_west",
    "ops_admin",
    "security_log",
    "backup_sync",
    "third_party_exchange"
  ]),
  expectedControlPointId: z.string().optional(),
  policyStatus: z.enum(["allowed", "blocked", "unknown"]).default("unknown")
});

export type Flow = z.infer<typeof flowSchema>;
