"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderKanban, Loader2, Plus } from "lucide-react";
import Link from "next/link";
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
import { useProjectsStore } from "@/lib/stores/projects";
import { useWorkspaceStore } from "@/lib/stores/workspace";

/**
 * Project list for the open workspace, following the workspace page's
 * list-first convention: the create form is the whole page only while there
 * is no project yet, otherwise it toggles from a "New project" button.
 * Any member may create; the backend enforces membership on every call.
 */
export function ProjectsPanel() {
  const workspaceId = useWorkspaceStore((s) => s.detail?.id ?? null);
  const projects = useProjectsStore((s) => s.projects);
  const status = useProjectsStore((s) => s.status);
  const error = useProjectsStore((s) => s.error);
  const loadList = useProjectsStore((s) => s.loadList);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId) void loadList(workspaceId);
  }, [workspaceId, loadList]);

  const resetForm = useCallback(() => {
    setName("");
    setSlug("");
    setDescription("");
    setFormError(null);
  }, []);

  const handleCreate = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!workspaceId) return;
      setSubmitting(true);
      setFormError(null);
      try {
        await useProjectsStore.getState().create(workspaceId, {
          name: name.trim(),
          ...(slug.trim() ? { slug: slug.trim() } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
        });
        resetForm();
        setCreating(false);
      } catch (error) {
        setFormError(errorMessage(error));
      } finally {
        setSubmitting(false);
      }
    },
    [workspaceId, name, slug, description, resetForm],
  );

  if (!workspaceId || (status === "loading" && projects.length === 0)) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (status === "error" && projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load projects</CardTitle>
          <CardDescription>{error ?? "Something went wrong."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const form = (
    <form onSubmit={handleCreate} className="space-y-3">
      {formError ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="project-name">Name</Label>
        <Input
          id="project-name"
          required
          minLength={2}
          maxLength={100}
          placeholder="Product launch"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-slug">URL slug (optional)</Label>
        <Input
          id="project-slug"
          maxLength={60}
          placeholder="product-launch"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens. Generated from the name if
          left blank.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-description">Description (optional)</Label>
        <Input
          id="project-description"
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" /> : "Create project"}
      </Button>
    </form>
  );

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create your first project</CardTitle>
          <CardDescription>
            Projects group the boards your team plans and tracks work on.
          </CardDescription>
        </CardHeader>
        <CardContent>{form}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Projects</CardTitle>
          <CardDescription>
            {projects.length === 1
              ? "1 project in this workspace."
              : `${projects.length} projects in this workspace.`}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            resetForm();
            setCreating((v) => !v);
          }}
        >
          <Plus /> New project
        </Button>
      </CardHeader>
      {creating ? (
        <CardContent className="border-t pt-6">{form}</CardContent>
      ) : null}
      <CardContent className={creating ? "space-y-3 pt-3" : "space-y-3"}>
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/workspaces/${project.workspaceId}/projects/${project.id}`}
            className="flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FolderKanban className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{project.name}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  /{project.slug}
                </span>
              </div>
              {project.description ? (
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {project.description}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 text-sm text-muted-foreground">
              {project.boards.length === 1
                ? "1 board"
                : `${project.boards.length} boards`}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
