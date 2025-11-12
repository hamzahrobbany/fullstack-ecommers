import { z } from "zod";

export const authResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    role: z.string(),
    tenantId: z.string().uuid(),
  }),
  tokens: z.object({
    accessToken: z.string(),
  }),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
