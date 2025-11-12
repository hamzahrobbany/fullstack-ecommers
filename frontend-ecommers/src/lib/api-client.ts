import ky, { type KyInstance, type Options } from 'ky';
import { getCookie } from 'cookies-next';

const DEFAULT_TIMEOUT = 10_000;
const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:3000/api';

const normalizeCookieValue = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const resolveCookie = (name: string): string | null => {
  try {
    const value = getCookie(name);
    return normalizeCookieValue(value ?? null);
  } catch (error) {
    console.warn(`[api-client] gagal membaca cookie "${name}":`, error);
    return null;
  }
};

const buildAuthorizationHeader = (token: string | null): string | null => {
  const normalized = normalizeCookieValue(token);
  if (!normalized) {
    return null;
  }

  return normalized.startsWith('Bearer ')
    ? normalized
    : `Bearer ${normalized}`;
};

export const apiClient: KyInstance = ky.create({
  prefixUrl: API_URL,
  credentials: 'include',
  timeout: DEFAULT_TIMEOUT,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = resolveCookie('kop_at');
        const tenantId = resolveCookie('tenant_id');

        const authHeader = buildAuthorizationHeader(token);
        if (authHeader) {
          request.headers.set('Authorization', authHeader);
        }

        if (tenantId) {
          request.headers.set('X-Tenant-ID', tenantId);
        }

        if (!request.headers.has('Accept')) {
          request.headers.set('Accept', 'application/json');
        }

        if (!request.headers.has('Content-Type')) {
          request.headers.set('Content-Type', 'application/json');
        }
      },
    ],
    beforeError: [
      (error) => {
        const { response } = error;
        if (response) {
          error.message = `HTTP ${response.status}: ${response.statusText}`;
        }
        return error;
      },
    ],
  },
});

export type ApiClient = KyInstance;

export const api: KyInstance = apiClient;

export const createApiClient = (options?: Options): KyInstance => {
  return apiClient.extend(options ?? {});
};
