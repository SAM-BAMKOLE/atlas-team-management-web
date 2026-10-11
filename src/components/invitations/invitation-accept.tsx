"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { workspacesApi } from "@/lib/api/workspaces";
import { useAuthStore } from "@/lib/stores/auth";

type Phase = "working" | "success" | "error";

/**
 * Accepts an emailed workspace invitation. The token is single-use and
 * time-limited; the backend validates it against the signed-in account's
 * email, so this runs only once the session is known to be authenticated.
 */
export function InvitationAccept({ token }: { token: string | null }) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const [phase, setPhase] = useState<Phase>("working");
  const [message, setMessage] = useState<string | null>(null);
  const [targetWorkspaceId, setTargetWorkspaceId] = useState<string | null>(
    null,
  );
  // Guards against React StrictMode double-invoking the effect in dev, which
  // would burn the single-use token on a second exchange.
  const started = useRef(false);

  const run = useCallback(async () => {
    if (!token) {
      setPhase("error");
      setMessage(
        "This invitation link is incomplete. Please open the link from your email again.",
      );
      return;
    }
    setPhase("working");
    setMessage(null);
    try {
      const result = await workspacesApi.acceptInvitation(token);
      setTargetWorkspaceId(result.workspaceId);
      setPhase("success");
      // Give the user a beat to read the confirmation before navigating.
      setTimeout(() => {
        router.replace(`/workspaces/${result.workspaceId}`);
      }, 900);
    } catch (error) {
      setPhase("error");
      setMessage(errorMessage(error));
    }
  }, [token, router]);

  useEffect(() => {
    if (status !== "authenticated" || started.current) return;
    started.current = true;
    void run();
  }, [status, run]);

  // Waiting on the session bootstrap: hold the spinner, don't act yet.
  if (status !== "authenticated" && phase === "working" && !message) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workspace invitation</CardTitle>
          <CardDescription>Checking your session…</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Verifying your sign-in before accepting.
        </CardContent>
      </Card>
    );
  }

  if (phase === "working") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workspace invitation</CardTitle>
          <CardDescription>Accepting your invitation…</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          This only takes a moment.
        </CardContent>
      </Card>
    );
  }

  if (phase === "success") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You're in!</CardTitle>
          <CardDescription>
            Your invitation was accepted. Opening the workspace…
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={`/workspaces/${targetWorkspaceId ?? ""}`}>
              Go to workspace now
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Could not accept invitation</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Invitations can only be accepted once and expire after a short time.
          If you still need access, ask the workspace owner to send a new
          invite.
        </p>
        <Button asChild variant="outline" className="self-start">
          <Link href="/workspaces">Back to workspaces</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
