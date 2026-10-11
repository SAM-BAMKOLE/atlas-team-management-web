"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api/config";

/**
 * Legacy landing spot: GOOGLE_CALLBACK_URL used to point at this frontend
 * path before the backend started receiving the Google code itself. If a
 * Google code still arrives here (stale tab, reverted config), hand it to the
 * backend, which finishes the exchange and redirects to /auth/oauth/callback.
 */
export function GoogleCodeForwarder({ code }: { code: string | null }) {
  const router = useRouter();

  useEffect(() => {
    if (code) {
      window.location.replace(
        `${API_BASE_URL}/auth/google/callback?code=${encodeURIComponent(code)}`,
      );
    } else {
      router.replace("/login");
    }
  }, [code, router]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Signing you in&hellip;</p>
        <span className="sr-only">Signing you in</span>
      </CardContent>
    </Card>
  );
}
