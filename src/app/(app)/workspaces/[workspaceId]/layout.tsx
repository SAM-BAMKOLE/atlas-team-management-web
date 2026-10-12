import { Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

/**
 * Thin server boundary handing the segment over to the client shell, which
 * reads `workspaceId` via `useParams` and loads the shared workspace store.
 * (No params promise is threaded down — a params promise passed into a client
 * component from a server layout never resolves on hydration, stranding cold
 * loads on the fallback.)
 *
 * With the (now removed) `cacheComponents` flag this Suspense was required for
 * the build; it stays as the correct boundary around the shell's `useParams`
 * read. Params resolve synchronously at request time, so the fallback only
 * covers the pre-hydration moment of a cold document load.
 */
export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<WorkspaceShellFallback />}>
      <WorkspaceShell>{children}</WorkspaceShell>
    </Suspense>
  );
}

/** Mirrors the shell's loading chrome (header skeletons + content blocks). */
function WorkspaceShellFallback() {
  return (
    <div className="w-full space-y-8 p-8">
      <div className="mt-1 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
