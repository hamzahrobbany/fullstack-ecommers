"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import { api } from "@/lib/api-client";
import { authResponseSchema } from "@/lib/zod-schemas/auth";
import type { AuthResponse } from "@/types/auth";
import { setCookie, deleteCookie } from "cookies-next";

type AuthContextType = {
  user: AuthResponse["user"] | null;
  isLoading: boolean;
  error: string | null;
  handleLogin: (payload: z.infer<typeof loginSchema>) => Promise<void>;
  handleLogout: () => void;
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantCode: z.string().optional(),
});

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async (payload: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setError(null);

    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) {
      setIsLoading(false);
      setError("Format data login tidak valid.");
      return;
    }

    try {
      const response = await api.post("auth/login", {
        json: {
          email: parsed.data.email,
          password: parsed.data.password,
          tenantCode: parsed.data.tenantCode ?? "salwa",
        },
      });

      const data = await response
        .json<unknown>()
        .catch(() => ({}) as Record<string, unknown>);
      if (!response.ok) {
        const message =
          typeof data === "object" && data && "message" in data ? (data as { message?: unknown }).message : null;
        throw new Error(
          typeof message === "string" ? message : `Login gagal (HTTP ${response.status})`,
        );
      }

      const parsedResponse = authResponseSchema.safeParse(data);
      if (!parsedResponse.success) {
        throw new Error("Format respons tidak sesuai.");
      }

      const auth = parsedResponse.data as AuthResponse;
      setCookie("kop_at", auth.tokens.accessToken, { path: "/", sameSite: "lax" });
      setCookie("tenant_id", auth.user.tenantId, { path: "/", sameSite: "lax" });
      setUser(auth.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login gagal. Coba lagi.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    deleteCookie("kop_at");
    deleteCookie("tenant_id");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam <AuthProvider>");
  }
  return context;
};
