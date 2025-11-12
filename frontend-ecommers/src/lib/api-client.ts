import ky, { type KyInstance } from "ky";
import { getCookie } from "cookies-next";

const rawApiPrefix = process.env.NEXT_PUBLIC_API_URL ?? "";
const apiPrefix = rawApiPrefix.replace(/\/+$/, "");

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
  },
});
