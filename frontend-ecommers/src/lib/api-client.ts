import ky, { HTTPError, type KyInstance } from "ky";
import { deleteCookie, getCookie, setCookie } from "cookies-next";

const rawApiPrefix = process.env.NEXT_PUBLIC_API_URL ?? "";
const apiPrefix = rawApiPrefix.replace(/\/+$/, "");

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${apiPrefix}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to refresh");
    }

    const data = (await response.json()) as { accessToken?: string | null };
    if (data.accessToken) {
      setCookie("kop_at", data.accessToken, { path: "/", sameSite: "lax" });
      return data.accessToken;
    }

    return null;
  } catch (error) {
    deleteCookie("kop_at");
    deleteCookie("kop_rt");
    return null;
  }
}

export const api: KyInstance = ky.create({
  prefixUrl: apiPrefix || undefined,
  credentials: "include",
  throwHttpErrors: false,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getCookie("kop_at");
        const tenantId = getCookie("tenant_id");

        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }

        if (tenantId) {
          request.headers.set("X-Tenant-ID", String(tenantId));
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status !== 401) {
          return response;
        }

        const newToken = await refreshAccessToken();
        if (!newToken) {
          throw new HTTPError(response);
        }

        const retryRequest = new Request(request);
        retryRequest.headers.set("Authorization", `Bearer ${newToken}`);
        return fetch(retryRequest);
      },
    ],
  },
});
