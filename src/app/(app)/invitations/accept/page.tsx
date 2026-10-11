"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvitationAccept } from "@/components/invitations/invitation-accept";
import { TokenFallback } from "@/components/auth/token-fallback";

/**
 * Landing page for the emailed invitation link (`/invitations/accept?token=…`).
 * The backend validates the token against the signed-in account's email, so
 * this requires a session — the (app) layout guard covers it while the session
 * bootstraps.
 *
 * The token is read client-side (`useSearchParams`) rather than by awaiting
 * `searchParams` in a server component: with `cacheComponents` the streamed
 * server resolution of that promise never completes on the client in dev, so
 * the page sat on its Suspense fallback forever. The client read hydrates
 * instantly, and the Suspense boundary keeps the URL-data hook valid.
 */
export default function AcceptInvitationPage() {
  return (
    <div className="mx-auto w-full max-w-3xl p-8">
      <Suspense fallback={<TokenFallback />}>
        <AcceptInvitationContent />
      </Suspense>
    </div>
  );
}

function AcceptInvitationContent() {
  const token = useSearchParams().get("token");
  return <InvitationAccept token={token} />;
}
