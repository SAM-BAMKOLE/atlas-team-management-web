"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth";

/** Restores the session from the refresh cookie once per page load. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return <>{children}</>;
}
