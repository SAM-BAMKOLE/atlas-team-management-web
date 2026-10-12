"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleBadge } from "@/components/workspace/role-badge";
import { useAuthStore } from "@/lib/stores/auth";
import { useWorkspaceStore } from "@/lib/stores/workspace";

/**
 * Loads the workspace detail once per entry and renders the shared header;
 * the store behind it also feeds the sidebar and the member/settings pages,
 * so a rename or role change updates everything at once. The workspace id
 * comes from `useParams` (suspension-free — a params *promise* passed into a
 * client component from a server layout never resolves on hydration, which
 * left cold loads stuck on the Suspense fallback). Children render whenever
 * the store has no detail yet (pages show their own loading skeletons) —
 * only a detail belonging to a *different* workspace is held back until the
 * switch completes. This also keeps every sub-route visible to
 * instant-navigation validation, which renders pages against an empty store.
 * A failed load (403 for non-members, 404) replaces the segment with a
 * recovery card.
 */
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const detail = useWorkspaceStore((s) => s.detail);
  const status = useWorkspaceStore((s) => s.status);
  const error = useWorkspaceStore((s) => s.error);
  const load = useWorkspaceStore((s) => s.load);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    void load(workspaceId);
  }, [workspaceId, load]);

  if (status === "error") {
    return (
      <div className="w-full p-8">
        <Card>
          <CardHeader>
            <CardTitle>Could not load workspace</CardTitle>
            <CardDescription>{error ?? "Something went wrong."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/workspaces">Back to workspaces</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const active =
    detail && detail.id === workspaceId ? detail : null;
  const myRole = active?.memberships.find((m) => m.userId === user?.id)?.role;
  const staleForUrl = detail !== null && detail.id !== workspaceId;

  return (
    <div className="w-full space-y-8 p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {active ? (
            <>
              <h1 className="truncate text-2xl font-semibold">
                {active.name}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  /{active.slug}
                </span>
                {myRole ? <RoleBadge role={myRole} /> : null}
              </div>
            </>
          ) : (
            <div className="mt-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          )}
        </div>
      </div>
      {staleForUrl ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
