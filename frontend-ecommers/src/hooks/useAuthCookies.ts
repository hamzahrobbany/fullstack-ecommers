import { setCookie } from 'cookies-next';

export function storeAuthCookies(tenantId: string, token: string) {
  setCookie('tenant_id', tenantId);
  setCookie('kop_at', token);
}
