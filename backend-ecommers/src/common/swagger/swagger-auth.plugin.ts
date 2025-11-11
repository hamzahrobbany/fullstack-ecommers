type SwaggerHeaders = Record<string, string>;
/**
 * Plugin Swagger custom untuk secara otomatis menambahkan header otentikasi & tenant.
 * Header diambil dari `localStorage` agar pengalaman testing di Swagger UI konsisten.
 */
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

export function swaggerAuthPlugin() {
  return function swaggerAuthPluginFactory() {
    return {
      statePlugins: {
        spec: {
          wrapActions: {
            executeRequest:
              (ori: (req: { headers?: SwaggerHeaders }) => Promise<unknown>) =>
              async (req: { headers?: SwaggerHeaders }): Promise<unknown> => {
                const headers: SwaggerHeaders = { ...(req.headers ?? {}) };

                try {
                  if (typeof window !== 'undefined' && window.localStorage) {
                    const token =
                      window.localStorage.getItem('swagger_token') ?? null;
                    const tenantId =
                      window.localStorage.getItem('swagger_tenant') ?? null;

                    if (!token) {
                      console.warn(
                        '[SwaggerPlugin] localStorage.swagger_token belum diatur. ' +
                          'Gunakan localStorage.setItem("swagger_token", "Bearer <token>")',
                      );
                    } else {
                      const normalizedToken = normalizeBearer(token);
                      if (normalizedToken) {
                        headers.Authorization = normalizedToken;
                      } else {
                        console.warn(
                          '[SwaggerPlugin] Nilai swagger_token tidak valid, lewati penyisipan Authorization',
                        );
                      }
                    }

                    if (!tenantId) {
                      console.warn(
                        '[SwaggerPlugin] localStorage.swagger_tenant belum diatur. ' +
                          'Gunakan localStorage.setItem("swagger_tenant", "<tenant>")',
                      );
                    } else {
                      const normalizedTenant = tenantId.trim();
                      if (normalizedTenant) {
                        headers['X-Tenant-ID'] = normalizedTenant;
                      } else {
                        console.warn(
                          '[SwaggerPlugin] Nilai swagger_tenant kosong setelah trim, lewati penyisipan X-Tenant-ID',
                        );
                      }
                    }
                  }
                } catch (error) {
                  console.warn(
                    '[SwaggerPlugin] Gagal menambahkan header auth/tenant:',
                    error,
                  );
                }

                return ori({ ...req, headers });
              },
          },
        },
      },
    };
  };
}
