/**
 * Access-token storage. The token lives in localStorage under "token" (same key
 * as the legacy CRM) so a logged-in session survives reloads. SSR-safe: every
 * accessor no-ops when there is no `window`.
 */
const TOKEN_KEY = "token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}
