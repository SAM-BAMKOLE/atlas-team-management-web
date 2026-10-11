import { Suspense } from "react";
import Link from "next/link";
import { GoogleCodeForwarder } from "@/components/auth/google-code-forwarder";
import { TokenFallback } from "@/components/auth/token-fallback";

/**
 * Legacy Google landing spot (the path GOOGLE_CALLBACK_URL pointed at before
 * the backend started receiving the code itself). Now only a forwarding
 * hop: any Google code is handed to the API, which completes the exchange and
 * redirects to /auth/oauth/callback. A bare visit goes back to sign-in.
 */
export default function GoogleCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          A
        </span>
        <span className="text-lg font-semibold">Atlas</span>
      </Link>
      <div className="w-full max-w-sm">
        <Suspense fallback={<TokenFallback />}>
          <GoogleCallbackContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function GoogleCallbackContent({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  return <GoogleCodeForwarder code={code ?? null} />;
}
