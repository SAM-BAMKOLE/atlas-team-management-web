"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SessionOverlay } from "@/components/session-overlay";
import { useAuthStore } from "@/lib/stores/auth";

/**
 * Client guard for the authenticated tree. While the session is unknown or
 * the redirect is in flight, children stay rendered under SessionOverlay
 * instead of unmounting. Signed-out visits carry their current URL in
 * `?next=` so deep links — notably the emailed invitation — survive signing
 * in (the auth layout replays it once authenticated).
 */
export function AppGuard({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      const here = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
    }
  }, [status, router]);

  return (
    <>
      <AppShell>{children}</AppShell>
      {status !== "authenticated" ? <SessionOverlay /> : null}
    </>
  );
}
