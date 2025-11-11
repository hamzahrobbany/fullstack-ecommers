export function swaggerAuthPlugin() {
  return function (system) {
    return {
      statePlugins: {
        spec: {
          wrapActions: {
            executeRequest: (ori) => async (req) => {
              try {
                const token = window?.localStorage?.getItem('swagger_token');
                const tenant = window?.localStorage?.getItem('swagger_tenant');

                req.headers = req.headers || {};
                if (token && !req.headers.Authorization) {
                  req.headers.Authorization = `Bearer ${token}`;
                }
                if (tenant && !req.headers['X-Tenant-ID']) {
                  req.headers['X-Tenant-ID'] = tenant;
                }
              } catch (e) {
                console.warn('[SwaggerPlugin] Header attach failed:', e);
              }
              return ori(req);
            },
          },
        },
      },
    };
  };
}
