'use client';

import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { deleteCookie } from 'cookies-next';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { storeAuthCookies } from '@/hooks/useAuthCookies';
import { authResponseSchema, loginSchema } from '@/lib/zod-schemas';
import { isBrowser, safeJsonParse } from '@/lib/helpers';
import type {
  AuthContextValue,
  AuthResponse,
  AuthState,
  AuthTenant,
  LoginPayload,
} from '@/types/auth';

const AUTH_STORAGE_KEY = 'fe-auth-state';

const initialState: AuthState = {
  user: null,
  tenant: null,
  tokens: null,
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const persistState = (state: AuthState) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[AuthProvider] gagal menyimpan state auth:', error);
  }
};

const restoreState = (): AuthState => {
  if (!isBrowser) return initialState;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return safeJsonParse<AuthState>(raw, initialState);
  } catch (error) {
    console.warn('[AuthProvider] gagal membaca state auth:', error);
    return initialState;
  }
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restored = restoreState();
    setState(restored);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      persistState(state);
    }
  }, [state, isLoading]);

  const handleLogin = useCallback(async (payload: LoginPayload) => {
    const parsedPayload = loginSchema.safeParse(payload);
    if (!parsedPayload.success) {
      throw new Error(parsedPayload.error.issues.map((issue) => issue.message).join('\n'));
    }

    setIsLoading(true);
    try {
      const response = await api
        .post('auth/login', { json: parsedPayload.data })
        .json<unknown>();
      const parsed = authResponseSchema.parse(response) as AuthResponse;

      storeAuthCookies(parsed.tenant.id, parsed.tokens.accessToken);

      setState({
        tenant: parsed.tenant,
        user: parsed.user,
        tokens: parsed.tokens,
      });
      toast.success(`Selamat datang kembali, ${parsed.user.name}!`);
    } catch (error) {
      console.error('[AuthProvider] login gagal:', error);
      const message =
        error instanceof Error ? error.message : 'Terjadi kesalahan saat login';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearState = useCallback(() => {
    deleteCookie('kop_at');
    deleteCookie('tenant_id');
    if (isBrowser) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setState(initialState);
  }, []);

  const handleLogout = useCallback(async () => {
    if (!state.tokens) {
      clearState();
      return;
    }

    setIsLoading(true);
    try {
      await api.post('auth/logout', {
        json: { refreshToken: state.tokens.refreshToken },
      });
    } catch (error) {
      console.warn('[AuthProvider] logout API error:', error);
    } finally {
      clearState();
      setIsLoading(false);
      toast.success('Berhasil logout.');
    }
  }, [state.tokens, clearState]);

  const handleSwitchTenant = useCallback(
    async (tenant: AuthTenant) => {
      setState((prev) => ({ ...prev, tenant }));
      const token = state.tokens?.accessToken ?? '';
      if (token) {
        storeAuthCookies(tenant.id, token);
      }
      toast.success(`Tenant aktif: ${tenant.name}`);
    },
    [state.tokens?.accessToken],
  );

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    isAuthenticated: Boolean(state.user && state.tokens),
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    switchTenant: handleSwitchTenant,
  }), [state, isLoading, handleLogin, handleLogout, handleSwitchTenant]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
