import ky, { type KyInstance } from "ky";

const rawApiPrefix = process.env.NEXT_PUBLIC_API_URL ?? "";
const apiPrefix = rawApiPrefix.replace(/\/+$/, "");

console.log("🌐 API Prefix:", process.env.NEXT_PUBLIC_API_URL);

export const api: KyInstance = ky.create({
  prefixUrl: apiPrefix || undefined,
  credentials: "include",
  throwHttpErrors: false,
});
