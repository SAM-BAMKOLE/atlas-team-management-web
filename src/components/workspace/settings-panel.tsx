"use client";

import { useCallback, useState } from "react";
import { Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api/errors";
import { workspacesApi } from "@/lib/api/workspaces";
import { useAuthStore } from "@/lib/stores/auth";
import { useWorkspaceStore } from "@/lib/stores/workspace";

/**
 * Workspace settings. Owners and admins get the rename form; everyone else
 * sees the current name and URL read-only (the backend enforces the same
 * rule on PATCH).
 */
export function SettingsPanel() {
  const currentUser = useAuthStore((s) => s.user);
  const detail = useWorkspaceStore((s) => s.detail);
  const update = useWorkspaceStore((s) => s.update);

  const [renameValue, setRenameValue] = useState(() => detail?.name ?? "");
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameSaved, setRenameSaved] = useState(false);

  const handleRename = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!detail) return;
      const name = renameValue.trim();
      if (name.length < 2 || name === detail.name) return;
      setRenaming(true);
      setRenameError(null);
      setRenameSaved(false);
      try {
        await workspacesApi.update(detail.id, { name });
        update((prev) => ({ ...prev, name }));
        setRenameSaved(true);
      } catch (error) {
        setRenameError(errorMessage(error));
      } finally {
        setRenaming(false);
      }
    },
    [detail, renameValue, update],
  );

  if (!detail) {
    return (
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>
    );
  }

  const currentRole = detail.memberships.find(
    (m) => m.userId === currentUser?.id,
  )?.role;
  const canManage = currentRole === "OWNER" || currentRole === "ADMIN";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="size-4" />
          Workspace settings
        </CardTitle>
        <CardDescription>
          {canManage
            ? "Update the workspace name."
            : "Only owners and admins can change the workspace name."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {canManage ? (
          <form onSubmit={handleRename} className="space-y-3">
            {renameError ? (
              <p className="text-sm text-destructive" role="alert">
                {renameError}
              </p>
            ) : null}
            {renameSaved ? (
              <p className="text-sm text-green-600" role="status">
                Workspace name updated.
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 space-y-2">
                <Label htmlFor="ws-rename">Workspace name</Label>
                <Input
                  id="ws-rename"
                  required
                  minLength={2}
                  maxLength={80}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={
                    renaming ||
                    renameValue.trim().length < 2 ||
                    renameValue.trim() === detail.name
                  }
                >
                  {renaming ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Save name"
                  )}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="truncate font-medium">{detail.name}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">URL</dt>
              <dd className="truncate font-medium">/{detail.slug}</dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
