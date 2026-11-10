import { SESSION_COOKIE, SESSION_MAX_AGE_REMEMBER } from "./constants";

/**
 * The `ngas_session` cookie is a NON-SENSITIVE marker used only by middleware to
 * decide whether to show protected routes. It does not contain the access token.
 *
 * With a real backend, the server should issue the actual session/refresh token as an
 * httpOnly, Secure, SameSite cookie — JavaScript should never be able to read it.
 */
export function setSessionCookie(remember: boolean): void {
  if (typeof document === "undefined") return;
  const maxAge = remember ? `; max-age=${SESSION_MAX_AGE_REMEMBER}` : "";
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${SESSION_COOKIE}=1; path=/; samesite=lax${maxAge}${secure}`;
}

export function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
