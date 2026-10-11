import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyEmailCard } from "@/components/auth/verify-email-card";
import { TokenFallback } from "@/components/auth/token-fallback";

export const metadata: Metadata = { title: "Verify email" };

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense fallback={<TokenFallback />}>
      <VerifyEmailContent searchParams={searchParams} />
    </Suspense>
  );
}

async function VerifyEmailContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <VerifyEmailCard token={token ?? null} />;
}
