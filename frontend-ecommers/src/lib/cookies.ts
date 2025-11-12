import { deleteCookie, getCookie, setCookie, type CookieValueTypes } from "cookies-next";

export type CookieOptions = Parameters<typeof setCookie>[2];

export const cookies = {
  get: (name: string): CookieValueTypes => getCookie(name),
  set: (name: string, value: string, options?: CookieOptions) => setCookie(name, value, options),
  remove: (name: string, options?: CookieOptions) => deleteCookie(name, options),
};
