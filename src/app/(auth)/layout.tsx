"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SessionOverlay } from "@/components/session-overlay";
import { safeNextPath } from "@/lib/safe-next";
import { useAuthStore } from "@/lib/stores/auth";

/**
 * Token pages (password reset, email verification) arrive by email and must
 * render their result even when a session exists — they are not sign-in
 * screens, so the session guard steps aside for them.
 */
const TOKEN_PATHS = new Set(["/reset-password", "/verify-email"]);

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();
  const pathname = usePathname();
  const isTokenRoute = TOKEN_PATHS.has(pathname);

  useEffect(() => {
    if (!isTokenRoute && status === "authenticated") {
      // Replay `?next=` (set by the app guard) so deep links — e.g. the
      // emailed invitation — survive signing in; anything missing or
      // unsafe falls back to the workspace list.
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(safeNextPath(next) ?? "/workspaces");
    }
  }, [isTokenRoute, status, router]);

  return (
    <>
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            A
          </span>
          <span className="text-lg font-semibold">Atlas</span>
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
      {/* Guard as an overlay: while the session is unknown or the redirect to
          /workspaces is in flight, children are covered instead of omitted so
          the segment always renders (instant-navigation validation). */}
      {!isTokenRoute && status !== "unauthenticated" ? (
        <SessionOverlay />
      ) : null}
    </>
  );
}
