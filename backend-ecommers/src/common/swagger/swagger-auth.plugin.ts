type SwaggerHeaders = Record<string, string>;
/**
 * Plugin Swagger custom untuk secara otomatis menambahkan header otentikasi & tenant.
 * Header diambil dari `localStorage` agar pengalaman testing di Swagger UI konsisten.
 */
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
                    const token = window.localStorage.getItem('swagger_token');
                    const tenantId =
                      window.localStorage.getItem('swagger_tenant');

                    if (!token) {
                      console.warn(
                        '[SwaggerPlugin] localStorage.swagger_token belum diatur. ' +
                          'Gunakan localStorage.setItem("swagger_token", "Bearer <token>")',
                      );
                    } else if (!headers.Authorization) {
                      headers.Authorization = token.startsWith('Bearer ')
                        ? token
                        : `Bearer ${token}`;
                    }

                    if (!tenantId) {
                      console.warn(
                        '[SwaggerPlugin] localStorage.swagger_tenant belum diatur. ' +
                          'Gunakan localStorage.setItem("swagger_tenant", "<tenant>")',
                      );
                    } else if (!headers['X-Tenant-ID']) {
                      headers['X-Tenant-ID'] = tenantId;
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
