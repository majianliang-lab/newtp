import { z } from "zod";

export const controlPointSchema = z.object({
  id: z.string(),
  deviceId: z.string(),
  controlType: z.enum(["boundary_block", "interzone_isolation", "ops_access", "audit", "logging"]),
  sourceDomainId: z.string(),
  destinationDomainId: z.string(),
  supportsSimulation: z.boolean().default(true),
  priority: z.number().int().default(100)
});

export type ControlPoint = z.infer<typeof controlPointSchema>;
