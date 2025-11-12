// src/components/AuthProvider.tsx
import { useCallback } from "react";
import { api } from "@/lib/api-client";
import { authResponseSchema } from "@/schemas/auth";
import type { AuthResponse } from "@/types";
import { z } from "zod";

// validasi input pakai zod (biar sinkron dengan backend)
const loginPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantCode: z.string().optional(),
});

export function useAuth() {
  const handleLogin = useCallback(
    async (payload: { email: string; password: string; tenantCode?: string }) => {
      setIsLoading(true);
      setError(null);

      // 1️⃣ validasi input
      const parsed = loginPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        setIsLoading(false);
        setError("Format data login tidak valid.");
        return;
      }

      try {
        // 2️⃣ kirim body sesuai LoginDto backend
        const res = await api.post("auth/login", {
          json: {
            email: parsed.data.email,
            password: parsed.data.password,
            tenantCode: parsed.data.tenantCode ?? "salwa", // bisa default salwa
          },
        });

        // 3️⃣ ambil dan parse response meski status non-2xx
        const data = await res.json<any>().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || `Login gagal (HTTP ${res.status})`);
        }

        // 4️⃣ validasi response (AuthResponse)
        const parsedResponse = authResponseSchema.safeParse(data);
        if (!parsedResponse.success) {
          throw new Error("Format respons login tidak sesuai skema.");
        }

        const auth = parsedResponse.data as AuthResponse;

        // 5️⃣ simpan user/session sesuai kebutuhanmu
        setUser(auth.user);
        // setCookie("kop_at", auth.tokens.accessToken, { path: "/", sameSite: "lax" });
        // setCookie("tenant_id", auth.user.tenantId, { path: "/", sameSite: "lax" });

      } catch (err: any) {
        setError(err?.message ?? "Login gagal. Coba lagi.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { handleLogin };
}
