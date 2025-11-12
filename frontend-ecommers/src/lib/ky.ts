'use client';

import ky, { type KyInstance, type Options } from 'ky';
import { getCookie } from 'cookies-next';

/**
 * 🌐 Ky instance
 * Injects Authorization & X-Tenant-ID headers automatically
 */

const rawApiPrefix = process.env.NEXT_PUBLIC_API_URL ?? '';
const apiPrefix = rawApiPrefix.replace(/\/+$/, '');

export const kyInstance: KyInstance = ky.create({
  prefixUrl: apiPrefix,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      (request) => {
        // Hindari error saat SSR
        if (typeof window === 'undefined') return;

        const token = getCookie('kop_at');
        const tenantId = getCookie('tenant_id');

        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }

        if (tenantId) {
          request.headers.set('X-Tenant-ID', String(tenantId));
        }
      },
    ],
  },
});
