"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { errorMessage } from "@/lib/api/errors";
import { useAuthStore } from "@/lib/stores/auth";

interface OauthCallbackProps {
  code: string | null;
}

/**
 * Lands on /auth/oauth/callback with the one-time code issued by the backend
 * after a successful Google exchange. Exchanges it for a token session, parks
 * the refresh token in the HttpOnly cookie via the BFF, and continues into
 * the app. Failures render a card with a way back instead of a dead loop.
 */
export function OauthCallback({ code }: OauthCallbackProps) {
  const router = useRouter();
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const [failure, setFailure] = useState<string | null>(null);
  const exchangeStarted = useRef(false);

  useEffect(() => {
    // The one-time code may only be exchanged once; StrictMode runs effects
    // twice, and there is no retry after the backend has consumed it.
    if (exchangeStarted.current) return;

    if (!code) {
      setFailure("This Google sign-in link is incomplete or has expired.");
      return;
    }

    exchangeStarted.current = true;
    (async () => {
      try {
        await signInWithGoogle(code);
        router.replace("/workspaces");
      } catch (error) {
        setFailure(errorMessage(error));
      }
    })();
  }, [code, router, signInWithGoogle]);

  if (failure) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google sign-in failed</CardTitle>
          <CardDescription>{failure}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Completing Google sign-in&hellip;
        </p>
        <span className="sr-only">Signing you in</span>
      </CardContent>
    </Card>
  );
}
