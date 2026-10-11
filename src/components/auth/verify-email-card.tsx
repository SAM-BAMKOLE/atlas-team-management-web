"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/errors";
import { MessageCard } from "./message-card";

type Status = "verifying" | "success" | "error";

export function VerifyEmailCard({ token }: { token: string | null }) {
  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [message, setMessage] = useState(
    token
      ? "One moment while we verify your email…"
      : "This verification link is missing or malformed.",
  );
  const startedRef = useRef(false);

  useEffect(() => {
    // The ref guards against StrictMode's double-invoked effect: verification
    // tokens are single-use, so the request must fire exactly once.
    if (!token || startedRef.current) return;
    startedRef.current = true;

    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((error) => {
        setMessage(errorMessage(error));
        setStatus("error");
      });
  }, [token]);

  if (status === "success") {
    return (
      <MessageCard
        title="Email verified"
        description="Your email address has been verified. You can sign in now."
      >
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </MessageCard>
    );
  }

  if (status === "error") {
    return (
      <MessageCard title="Verification failed" description={message}>
        <Button variant="outline" asChild>
          <Link href="/login">Back to sign in</Link>
        </Button>
      </MessageCard>
    );
  }

  return (
    <MessageCard title="Verifying your email" description={message} />
  );
}
