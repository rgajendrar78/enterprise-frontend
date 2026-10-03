import { AUTH } from "@/constants/config";

/** Mirrors the token into a cookie for `proxy.ts`. Not HttpOnly — harden by having the API set it. */

export function setAuthCookie(token: string): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${AUTH.COOKIE_NAME}=${token}; path=/; max-age=${AUTH.COOKIE_MAX_AGE_SECONDS}; samesite=lax${secure}`;
}

export function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH.COOKIE_NAME}=; path=/; max-age=0`;
}
