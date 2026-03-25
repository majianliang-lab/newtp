import { z } from "zod";

export const protectionObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.enum(["2", "3", "4"]),
  ownerTeam: z.string(),
  description: z.string().optional()
});

export type ProtectionObject = z.infer<typeof protectionObjectSchema>;
