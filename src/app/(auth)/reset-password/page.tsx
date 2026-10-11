"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { TokenFallback } from "@/components/auth/token-fallback";

/**
 * The token is read client-side (`useSearchParams`) rather than by awaiting
 * `searchParams` in a server component: with `cacheComponents` the streamed
 * server resolution of that promise never completes on the client in dev, so
 * the page sat on its Suspense fallback forever. The client read hydrates
 * instantly, and the Suspense boundary keeps the URL-data hook valid.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<TokenFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const token = useSearchParams().get("token");
  return <ResetPasswordForm token={token} />;
}
