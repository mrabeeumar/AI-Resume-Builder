import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
  plan: z.enum(["PRO", "TEAM"]),
});

export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>;
