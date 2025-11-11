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
                  const storage =
                    typeof window !== 'undefined'
                      ? window.localStorage
                      : undefined;
                  const bearerToken =
                    storage?.getItem('swagger_token') ??
                    storage?.getItem('access_token') ??
                    undefined;
                  const tenantId =
                    storage?.getItem('swagger_tenant') ??
                    storage?.getItem('tenant_id') ??
                    undefined;

                  if (bearerToken && !headers.Authorization) {
                    headers.Authorization = `Bearer ${bearerToken}`;
                  }

                  if (tenantId && !headers['X-Tenant-ID']) {
                    headers['X-Tenant-ID'] = tenantId;
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
