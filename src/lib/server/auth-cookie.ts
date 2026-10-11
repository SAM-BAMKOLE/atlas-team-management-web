/**
 * Shared cookie settings for the HttpOnly refresh-token cookie.
 *
 * The cookie path is scoped to /api/auth so the browser only ever sends the
 * refresh token to the Next.js BFF auth routes — never to application pages
 * or other route handlers.
 */

export const REFRESH_COOKIE = "atlas_refresh";
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function setRefreshCookie(
  cookies: { set: (name: string, value: string, options: object) => unknown },
  token: string,
  maxAge: number = REFRESH_COOKIE_MAX_AGE,
): void {
  cookies.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge,
  });
}

export function clearRefreshCookie(cookies: {
  set: (name: string, value: string, options: object) => unknown;
}): void {
  cookies.set(REFRESH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: 0,
  });
}
