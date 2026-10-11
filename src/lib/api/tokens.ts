/**
 * In-memory access token store.
 *
 * The access token lives only in JavaScript memory and is sent as a bearer
 * header. The refresh token never reaches JavaScript — it lives in an
 * HttpOnly cookie managed by the Next.js auth route handlers (see the BFF
 * layer added with the auth state).
 */

let accessToken: string | null = null;
let sessionExpiredHandler: (() => void) | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Registered by the auth store: invoked when a refresh attempt fails. */
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler;
}

export function notifySessionExpired(): void {
  sessionExpiredHandler?.();
}
