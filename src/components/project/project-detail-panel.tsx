"use client";

import { useCallback, useEffect, useState } from "react";
import { Columns3, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api/errors";
import type { Board } from "@/lib/api/types";
import { useProjectsStore } from "@/lib/stores/projects";
import { useWorkspaceStore } from "@/lib/stores/workspace";

/**
 * One board's columns as badges with an inline add-column form. The new
 * column's position is the next free integer (the backend requires unique
 * positions per board and rejects conflicts).
 */
function BoardCard({
  workspaceId,
  projectId,
  board,
}: {
  workspaceId: string;
  projectId: string;
  board: Board;
}) {
  const [adding, setAdding] = useState(false);
  const [columnName, setColumnName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns = board.columns ?? [];

  const handleAdd = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const name = columnName.trim();
      if (!name) return;
      setSubmitting(true);
      setError(null);
      try {
        await useProjectsStore
          .getState()
          .createColumn(workspaceId, projectId, board.id, {
            name,
            position:
              Math.max(-1, ...columns.map((c) => c.position)) + 1,
          });
        setColumnName("");
        setAdding(false);
      } catch (error) {
        setError(errorMessage(error));
      } finally {
        setSubmitting(false);
      }
    },
    [workspaceId, projectId, board.id, columnName, columns],
  );

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Columns3 className="size-4 shrink-0 text-muted-foreground" />
          <Link
            href={`/workspaces/${workspaceId}/projects/${projectId}/boards/${board.id}`}
            className="truncate font-medium hover:underline"
          >
            {board.name}
          </Link>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setError(null);
            setAdding((v) => !v);
          }}
        >
          <Plus /> Add column
        </Button>
      </div>
      {columns.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {columns.map((column) => (
            <Badge key={column.id} variant="outline">
              {column.name}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No columns yet.</p>
      )}
      {adding ? (
        <form onSubmit={handleAdd} className="mt-3 flex gap-2">
          <Input
            autoFocus
            required
            maxLength={80}
            placeholder="Column name"
            aria-label={`New column for ${board.name}`}
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : "Add"}
          </Button>
        </form>
      ) : null}
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Project detail: the project's boards, each with its columns, plus create
 * forms for both. The workspace id comes from the shared store (the shell
 * only renders children for the matching workspace); the project id is the
 * route param passed down by the server page.
 */
export function ProjectDetailPanel({ projectId }: { projectId: string }) {
  const workspaceId = useWorkspaceStore((s) => s.detail?.id ?? null);
  const active = useProjectsStore((s) => s.active);
  const status = useProjectsStore((s) => s.activeStatus);
  const error = useProjectsStore((s) => s.activeError);
  const loadActive = useProjectsStore((s) => s.loadActive);

  const [creating, setCreating] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId) void loadActive(workspaceId, projectId);
  }, [workspaceId, projectId, loadActive]);

  const handleCreateBoard = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!workspaceId) return;
      setSubmitting(true);
      setFormError(null);
      try {
        await useProjectsStore
          .getState()
          .createBoard(workspaceId, projectId, { name: boardName.trim() });
        setBoardName("");
        setCreating(false);
      } catch (error) {
        setFormError(errorMessage(error));
      } finally {
        setSubmitting(false);
      }
    },
    [workspaceId, projectId, boardName],
  );

  if (!workspaceId || (status === "loading" && !active)) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === "error" || (active && active.id !== projectId)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load project</CardTitle>
          <CardDescription>{error ?? "Something went wrong."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!active) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{active.name}</CardTitle>
          <CardDescription>
            {active.description ?? `/${active.slug}`}
          </CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Boards</CardTitle>
            <CardDescription>
              Each board is a kanban view; columns are its lanes.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFormError(null);
              setCreating((v) => !v);
            }}
          >
            <Plus /> New board
          </Button>
        </CardHeader>
        {creating ? (
          <CardContent className="border-t pt-6">
            <form onSubmit={handleCreateBoard} className="flex gap-2">
              {formError ? (
                <p
                  className="w-full text-sm text-destructive"
                  role="alert"
                >
                  {formError}
                </p>
              ) : null}
              <Input
                autoFocus
                required
                minLength={2}
                maxLength={100}
                placeholder="Engineering board"
                aria-label="Board name"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : "Create"}
              </Button>
            </form>
          </CardContent>
        ) : null}
        <CardContent className={creating ? "space-y-3 pt-3" : "space-y-3"}>
          {active.boards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No boards yet — create the first one above.
            </p>
          ) : (
            active.boards.map((board) => (
              <BoardCard
                key={board.id}
                workspaceId={workspaceId}
                projectId={projectId}
                board={board}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
