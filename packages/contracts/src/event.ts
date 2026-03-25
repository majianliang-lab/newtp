import { z } from "zod";

export const eventSchema = z.object({
  id: z.string(),
  eventType: z.enum(["alert", "incident", "config-change", "block-action"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  assetId: z.string().optional(),
  deviceId: z.string().optional(),
  flowId: z.string().optional(),
  summary: z.string()
});

export type Event = z.infer<typeof eventSchema>;
