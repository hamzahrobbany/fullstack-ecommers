/* ============================================================================
 * 📘 Swagger Plugins for E-Commers API
 * ============================================================================
 * Fungsi:
 * - Simpan token & tenant dari hasil login otomatis.
 * - Tambahkan header Authorization dan X-Tenant-ID ke semua request.
 * ============================================================================
 */
export function swaggerAuthPlugin() {
  return function (system: any) {
    return {
      statePlugins: {
        spec: {
          wrapActions: {
            // ✅ Inject headers otomatis ke semua request
            executeRequest: (original: any) => async (req: any) => {
              try {
                // Ambil token & tenant dari localStorage
                const token = window.localStorage.getItem('swagger_token');
                const tenant = window.localStorage.getItem('swagger_tenant');

                req.headers = req.headers || {};

                if (token && !req.headers.Authorization) {
                  req.headers.Authorization = `Bearer ${token}`;
                }

                if (tenant && !req.headers['X-Tenant-ID']) {
                  req.headers['X-Tenant-ID'] = tenant;
                }

                console.log('[SwaggerAuthPlugin]', 'Token & Tenant attached:', {
                  hasToken: !!token,
                  hasTenant: !!tenant,
                });
              } catch (err) {
                console.warn('[SwaggerAuthPlugin] Failed to attach headers:', err);
              }

              return original(req);
            },
          },
        },
        // ✅ Simpan token & tenant otomatis setelah login
        auth: {
          wrapActions: {
            authorizeRequest: (oriAction: any) => (payload: any) => {
              if (payload?.auth?.name === 'Bearer') {
                const token = payload.auth.value;
                if (token) {
                  window.localStorage.setItem('swagger_token', token.replace(/^Bearer\s+/i, ''));
                  console.log('[SwaggerAuthPlugin] Token saved:', token);
                }
              }
              return oriAction(payload);
            },
          },
        },
        // ✅ Tangkap response login dan simpan token + tenant
        response: {
          wrapActions: {
            receive: (ori: any) => (res: any) => {
              try {
                const body = res?.data;
                if (body?.tokens?.accessToken && body?.tenant?.id) {
                  window.localStorage.setItem('swagger_token', body.tokens.accessToken);
                  window.localStorage.setItem('swagger_tenant', body.tenant.id);
                  console.log('[SwaggerAuthPlugin] Saved token & tenant automatically');
                }
              } catch (e) {
                console.warn('[SwaggerAuthPlugin] Failed to parse login response');
              }
              return ori(res);
            },
          },
        },
      },
    };
  };
}
