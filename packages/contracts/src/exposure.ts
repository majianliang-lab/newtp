import { z } from "zod";

export const exposureSchema = z.object({
  id: z.string(),
  publicIp: z.string(),
  domainName: z.string().optional(),
  openPort: z.number(),
  protocol: z.enum(["tcp", "udp"]),
  backendAssetId: z.string(),
  edgeDeviceId: z.string().optional(),
  logVisibilityStatus: z.enum(["visible", "partial", "blind"]).default("visible")
});

export type Exposure = z.infer<typeof exposureSchema>;
