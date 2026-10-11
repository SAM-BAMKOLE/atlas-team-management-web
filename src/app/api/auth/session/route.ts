import { NextResponse } from "next/server";
import { setRefreshCookie } from "@/lib/server/auth-cookie";

/**
 * Stores a refresh token received from a successful login/registration into
 * the HttpOnly cookie. The token is never persisted client-side.
 */
export async function POST(request: Request) {
  let body: { refreshToken?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (typeof body.refreshToken !== "string" || body.refreshToken.length === 0) {
    return NextResponse.json(
      { error: "refreshToken is required" },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ success: true });
  setRefreshCookie(response.cookies, body.refreshToken);
  return response;
}
