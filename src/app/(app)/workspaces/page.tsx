"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type {
  CreateWorkspaceInput,
  Membership,
  Workspace,
} from "@/lib/api/types";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/ui/button";

export default function WorkspacesPage() {
  const status = useAuthStore((s) => s.status);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const hasWorkspaces = memberships.length > 0;
  // With no workspaces the form *is* the page; otherwise it opens on demand.
  const showForm = !loading && (!hasWorkspaces || formOpen);

  // Wait for the session before fetching: the guard overlay covers this page
  // until the refresh cookie resolves, and an early call would race it.
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    apiFetch<Membership[]>("/workspaces")
      .then((data) => {
        if (!cancelled) setMemberships(data);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const dto: CreateWorkspaceInput = { name: name.trim() };
      if (slug.trim()) dto.slug = slug.trim();
      await apiFetch<Workspace>("/workspaces", {
        method: "POST",
        body: dto,
      });
      // POST returns the workspace only; refetch to get the membership row.
      const fresh = await apiFetch<Membership[]>("/workspaces");
      setMemberships(fresh);
      resetForm();
      setFormOpen(false);
    } catch (error) {
      setCreateError(errorMessage(error));
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setName("");
    setSlug("");
    setCreateError(null);
  }

  return (
    <div className="w-full p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Workspaces</h1>
        {hasWorkspaces && !formOpen ? (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            New workspace
          </Button>
        ) : null}
      </div>

      {/* Create workspace */}
      {showForm ? (
        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="ws-name" className="text-sm font-medium">
              Workspace name
            </label>
            <input
              id="ws-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Atlas Team"
              minLength={2}
              maxLength={80}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ws-slug" className="text-sm font-medium">
              Slug <span className="text-muted-foreground">(optional)</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens. Generated from the name
              if left blank.
            </p>
            <input
              id="ws-slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="atlas-team"
              maxLength={50}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Lowercase letters, numbers, and hyphens"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          {createError ? (
            <p className="text-sm text-destructive" role="alert">
              {createError}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button type="submit" variant="outline" disabled={creating}>
              {creating ? "Creating…" : "Create workspace"}
            </Button>
            {hasWorkspaces ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFormOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      {/* Workspace list */}
      {hasWorkspaces ? (
        <div className="mt-6">
          <ul className="divide-y rounded-md border bg-background">
            {memberships.map((membership) => (
              <li key={membership.id}>
                <a
                  href={`/workspaces/${membership.workspace.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold uppercase">
                      {membership.workspace.name.slice(0, 2)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {membership.workspace.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        /{membership.workspace.slug}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {membership.role}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {loadError && !loading ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
