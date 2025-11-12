type SwaggerHeaders = Record<string, string>;

const normalizeBearer = (token: string | null): string | null => {
  if (!token) {
    return null;
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith('Bearer ') ? trimmed : `Bearer ${trimmed}`;
};

const normalizeTenant = (tenant: string | null): string | null => {
  if (!tenant) {
    return null;
  }

  const trimmed = tenant.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readLocalStorage = (key: string): string | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    return window.localStorage.getItem(key) ?? null;
  } catch (error) {
    console.warn(`[SwaggerPlugin] Gagal membaca localStorage key "${key}"`, error);
    return null;
  }
};

export function swaggerAuthPlugin(_system?: unknown): Record<string, unknown> {
  return {
    statePlugins: {
      spec: {
        wrapActions: {
          executeRequest:
            (original: (req: { headers?: SwaggerHeaders }) => Promise<unknown>) =>
            async (req: { headers?: SwaggerHeaders }): Promise<unknown> => {
              const nextReq: { headers: SwaggerHeaders } = {
                ...req,
                headers: { ...(req.headers ?? {}) },
              };

              try {
                const token = readLocalStorage('swagger_token');
                const tenantId = readLocalStorage('swagger_tenant');

                if (token && !nextReq.headers.Authorization) {
                  const normalizedToken = normalizeBearer(token);
                  if (normalizedToken) {
                    nextReq.headers.Authorization = normalizedToken;
                  }
                }

                if (tenantId && !nextReq.headers['X-Tenant-ID']) {
                  const normalizedTenant = normalizeTenant(tenantId);
                  if (normalizedTenant) {
                    nextReq.headers['X-Tenant-ID'] = normalizedTenant;
                  }
                }
              } catch (error) {
                console.warn('[SwaggerPlugin] Header injection failed:', error);
              }

              return original(nextReq);
            },
        },
      },
    },
  };
}
