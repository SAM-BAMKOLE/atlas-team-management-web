import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/api/config";
import { REFRESH_COOKIE, setRefreshCookie } from "@/lib/server/auth-cookie";

/**
 * Rotation replay window (a refresh-token grace window at the BFF layer).
 *
 * The backend hard-revokes the old refresh token the moment it is rotated,
 * so a rotation whose response never reaches the browser — the user
 * navigated away mid-refresh and the fetch was aborted — leaves the browser
 * holding a revoked token and the session dies (sign-out on every
 * subsequent navigation). To prevent that, recent rotations are remembered
 * for a short window and a presented token follows its chain to the newest
 * successor instead of being forwarded as-is. The durable fix belongs in the
 * backend (revoke with a `revokedAt` grace period); this map is in-memory
 * and per-instance, which is best-effort on multi-instance deployments.
 */
const ROTATION_REPLAY_MS = 60_000;
const rotations = new Map<string, { next: string; expires: number }>();

function pruneRotations(): void {
  const now = Date.now();
  for (const [token, entry] of rotations) {
    if (entry.expires <= now) rotations.delete(token);
  }
}

/** Most recent successor of `token` still inside the replay window. */
function replayableSuccessor(token: string): string {
  let current = token;
  for (let hop = 0; hop < 8; hop++) {
    const entry = rotations.get(current);
    if (!entry || entry.expires <= Date.now()) break;
    current = entry.next;
  }
  return current;
}

function rememberRotation(oldToken: string, newToken: string): void {
  rotations.set(oldToken, {
    next: newToken,
    expires: Date.now() + ROTATION_REPLAY_MS,
  });
}

/**
 * Rotates the refresh session: reads the HttpOnly cookie, forwards it to the
 * backend (which expects the token in the request body), updates the cookie
 * with the rotated token, and passes the response through — including
 * `accessToken` once the backend starts issuing it.
 *
 * A failed refresh deliberately leaves the cookie alone: with concurrent
 * refreshes (multi-tab, navigation races) one rotation succeeds while the
 * other presents the just-rotated token and fails — clearing here would wipe
 * the *valid* cookie the successful rotation just set and log the user out.
 * Truly dead cookies are replaced by the next sign-in regardless.
 */
export async function POST() {
  pruneRotations();
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh session" }, { status: 401 });
  }

  const token = replayableSuccessor(refreshToken);

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "API unreachable" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: "Refresh failed" }, { status: 401 });
  }

  const data = (await upstream.json()) as {
    refreshToken: string;
    expiresAt?: string;
    accessToken?: string;
  };

  // Record the rotation under the presented token and, when replaying, under
  // the original cookie too — so a browser still holding a pre-rotation
  // token can follow the chain to the newest one on its next refresh.
  rememberRotation(token, data.refreshToken);
  if (token !== refreshToken) {
    rememberRotation(refreshToken, data.refreshToken);
  }

  const maxAge = data.expiresAt
    ? Math.max(1, Math.floor((Date.parse(data.expiresAt) - Date.now()) / 1000))
    : undefined;

  const response = NextResponse.json(data);
  setRefreshCookie(response.cookies, data.refreshToken, maxAge);
  return response;
}
