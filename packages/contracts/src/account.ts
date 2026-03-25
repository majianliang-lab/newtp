import { z } from "zod";

export const accountSchema = z.object({
  id: z.string(),
  employeeId: z.string().optional(),
  accountName: z.string(),
  accountType: z.enum(["human", "system", "shared", "temporary", "api"]),
  systemId: z.string().optional(),
  permissionLevel: z.enum(["read", "operate", "admin"]),
  viaBastion: z.boolean().default(false),
  mfaEnabled: z.boolean().default(false)
});

export type Account = z.infer<typeof accountSchema>;
