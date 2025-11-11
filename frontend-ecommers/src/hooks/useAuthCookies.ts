import { setCookie } from 'cookies-next';

type CookieOptions = Parameters<typeof setCookie>[2];

const defaultCookieOptions: CookieOptions = {
  path: '/',
  sameSite: 'lax',
};

const normalizeToken = (token: string): string => {
  const trimmed = token.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.startsWith('Bearer ') ? trimmed : `Bearer ${trimmed}`;
};

const normalizeTenantId = (tenantId: string): string => tenantId.trim();

export function storeAuthCookies(tenantId: string, token: string) {
  const normalizedToken = normalizeToken(token);
  const normalizedTenant = normalizeTenantId(tenantId);

  if (normalizedTenant) {
    setCookie('tenant_id', normalizedTenant, defaultCookieOptions);
  }
  if (normalizedToken) {
    setCookie('kop_at', normalizedToken, defaultCookieOptions);
  }

  if (typeof window !== 'undefined') {
    try {
      if (normalizedTenant) {
        window.localStorage.setItem('swagger_tenant', normalizedTenant);
      }
      if (normalizedToken) {
        window.localStorage.setItem('swagger_token', normalizedToken);
      }
    } catch (error) {
      console.warn('[useAuthCookies] gagal menyimpan ke localStorage:', error);
    }
  }
}
