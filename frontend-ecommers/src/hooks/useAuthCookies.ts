import { setCookie } from 'cookies-next';

type CookieOptions = Parameters<typeof setCookie>[2];

const defaultCookieOptions: CookieOptions = {
  path: '/',
  sameSite: 'lax',
};

const normalizeToken = (token: string): string => {
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
};

export function storeAuthCookies(tenantId: string, token: string) {
  const normalizedToken = normalizeToken(token);

  setCookie('tenant_id', tenantId, defaultCookieOptions);
  setCookie('kop_at', normalizedToken, defaultCookieOptions);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('swagger_tenant', tenantId);
      window.localStorage.setItem('swagger_token', normalizedToken);
    } catch (error) {
      console.warn('[useAuthCookies] gagal menyimpan ke localStorage:', error);
    }
  }
}
