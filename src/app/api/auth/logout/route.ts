import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/api/config";
import {
  REFRESH_COOKIE,
  clearRefreshCookie,
} from "@/lib/server/auth-cookie";

/**
 * Revokes the refresh session server-side and clears the cookie. Idempotent:
 * succeeds even when no cookie is present or the backend is unreachable.
 */
export async function POST() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
    } catch {
      // The cookie is cleared regardless so the local session ends either way.
    }
  }

  const response = NextResponse.json({ success: true });
  clearRefreshCookie(response.cookies);
  return response;
}
