/* ============================================================================
 * 📘 Swagger Plugins for E-Commers API (Full Auto Auth)
 * ============================================================================
 * Fitur:
 * 1️⃣ Simpan token & tenant ke localStorage saat login.
 * 2️⃣ Isi otomatis field "Authorize" di Swagger UI.
 * 3️⃣ Sisipkan header Authorization & X-Tenant-ID di semua request.
 * ============================================================================
 */
export function swaggerAuthPlugin() {
  return function (system: any) {
    return {
      statePlugins: {
        spec: {
          wrapActions: {
            executeRequest: (original: any) => async (req: any) => {
              try {
                const token = window.localStorage.getItem('swagger_token');
                const tenant = window.localStorage.getItem('swagger_tenant');
                req.headers = req.headers || {};

                if (token && !req.headers.Authorization) {
                  req.headers.Authorization = `Bearer ${token}`;
                }
                if (tenant && !req.headers['X-Tenant-ID']) {
                  req.headers['X-Tenant-ID'] = tenant;
                }

                console.log('[SwaggerAuthPlugin] Attached headers:', {
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

        response: {
          wrapActions: {
            receive: (ori: any) => (res: any) => {
              try {
                const body = res?.data;
                if (body?.tokens?.accessToken && body?.tenant?.id) {
                  const token = body.tokens.accessToken;
                  const tenant = body.tenant.id;

                  // Simpan ke localStorage
                  window.localStorage.setItem('swagger_token', token);
                  window.localStorage.setItem('swagger_tenant', tenant);

                  console.log('[SwaggerAuthPlugin] Saved token & tenant automatically');

                  // Inject ke state internal Swagger (biar muncul di Authorize box)
                  if (system?.authActions?.authorize) {
                    system.authActions.authorize({
                      Bearer: { name: 'Bearer', schema: { type: 'apiKey' }, value: `Bearer ${token}` },
                    });
                    console.log('[SwaggerAuthPlugin] Injected token into Swagger Authorize UI');
                  }
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
