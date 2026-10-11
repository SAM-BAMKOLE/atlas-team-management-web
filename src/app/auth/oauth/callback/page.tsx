import { Suspense } from "react";
import Link from "next/link";
import { OauthCallback } from "@/components/auth/oauth-callback";
import { TokenFallback } from "@/components/auth/token-fallback";

/**
 * Landing page for the backend's post-Google redirect: the API exchanges the
 * Google code, mints a short-lived one-time code, and 302s here with it.
 *
 * Deliberately outside the (auth) group: the session guard must not race the
 * token exchange with a redirect.
 */
export default function OauthCallbackPage({
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
          <OauthCallbackContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function OauthCallbackContent({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  return <OauthCallback code={code ?? null} />;
}
