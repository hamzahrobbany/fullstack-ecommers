import ky, { Options } from 'ky';
import { getCookie } from 'cookies-next';

const DEFAULT_TIMEOUT = 10_000;
const API_PREFIX = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

const resolveCookie = (name: string): string | null => {
  try {
    const value = getCookie(name);
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
    return null;
  } catch (error) {
    console.warn(`[api-client] gagal membaca cookie "${name}":`, error);
    return null;
  }
};

const buildAuthorizationHeader = (token: string | null): string | null => {
  if (!token) {
    return null;
  }
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
};

export const api = ky.create({
  prefixUrl: API_PREFIX,
  credentials: 'include',
  timeout: DEFAULT_TIMEOUT,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = resolveCookie('kop_at');
        const tenantId = resolveCookie('tenant_id');

        const authHeader = buildAuthorizationHeader(token);
        if (authHeader && !request.headers.has('Authorization')) {
          request.headers.set('Authorization', authHeader);
        }

        if (tenantId && !request.headers.has('X-Tenant-ID')) {
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

export type ApiClient = typeof api;

export const createApiClient = (options?: Options): ApiClient => {
  return api.extend(options ?? {});
};
