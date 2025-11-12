import type { AuthResponse as AuthResponseSchema } from "@/lib/zod-schemas/auth";

export type AuthResponse = AuthResponseSchema;
export type AuthUser = AuthResponse["user"];
