"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { Board, Column, UpdateColumnInput } from "@/lib/api/types";
import { useAuthStore } from "@/lib/stores/auth";
import { useProjectsStore } from "@/lib/stores/projects";
import { useWorkspaceStore } from "@/lib/stores/workspace";

/** Pull the task count out of the backend's 409 "still holds N task(s)" text. */
function conflictTaskCount(message: string): number | null {
  const match = message.match(/(\d+)\s+task/i);
  return match ? Number(match[1]) : null;
}

/**
 * One column as a chip with a menu: rename and move are open to any member,
 * deleting is owners/admins only. Deleting tries without `force` first; when
 * the column still holds tasks the backend answers 409 and the chip switches
 * to an inline confirmation that deletes the tasks too.
 */
function ColumnChip({
  workspaceId,
  projectId,
  boardId,
  column,
  position,
  total,
  canManage,
}: {
  workspaceId: string;
  projectId: string;
  boardId: string;
  column: Column;
  position: number;
  total: number;
  canManage: boolean;
}) {
  const [mode, setMode] = useState<"view" | "rename" | "confirm">("view");
  const [name, setName] = useState(column.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const update = useCallback(
    async (input: UpdateColumnInput) => {
      setBusy(true);
      setError(null);
      try {
        await useProjectsStore
          .getState()
          .updateColumn(workspaceId, projectId, boardId, column.id, input);
        return true;
      } catch (failure) {
        setError(errorMessage(failure));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [workspaceId, projectId, boardId, column.id],
  );

  const handleRename = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const next = name.trim();
      if (!next || next === column.name) {
        setName(column.name);
        setMode("view");
        return;
      }
      if (await update({ name: next })) setMode("view");
    },
    [name, column.name, update],
  );

  const handleDelete = useCallback(
    async (force: boolean) => {
      setBusy(true);
      setError(null);
      try {
        await useProjectsStore
          .getState()
          .deleteColumn(workspaceId, projectId, boardId, column.id, force);
      } catch (failure) {
        if (!force && failure instanceof ApiError && failure.isConflict) {
          const count = conflictTaskCount(failure.messages[0] ?? "");
          setConfirmMessage(
            count === null
              ? "This column still contains tasks. Deleting it will delete them too."
              : `This column still holds ${count} task${
                  count === 1 ? "" : "s"
                }. Deleting it will delete ${
                  count === 1 ? "it" : "them"
                } too.`,
          );
          setMode("confirm");
        } else {
          setError(errorMessage(failure));
        }
        setBusy(false);
      }
    },
    [workspaceId, projectId, boardId, column.id],
  );

  if (error) {
    return (
      <span
        role="alert"
        className="flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/5 py-0.5 pr-1 pl-2.5 text-xs text-destructive"
      >
        {error}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Dismiss error"
          onClick={() => {
            setError(null);
            setMode("view");
          }}
        >
          <X />
        </Button>
      </span>
    );
  }

  if (mode === "confirm") {
    return (
      <span className="flex flex-wrap items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1 text-xs">
        <span>{confirmMessage}</span>
        <Button
          type="button"
          size="xs"
          variant="destructive"
          disabled={busy}
          onClick={() => void handleDelete(true)}
        >
          {busy ? <Loader2 className="animate-spin" /> : "Delete"}
        </Button>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          disabled={busy}
          onClick={() => setMode("view")}
        >
          Cancel
        </Button>
      </span>
    );
  }

  if (mode === "rename") {
    return (
      <form onSubmit={handleRename} className="flex items-center gap-1">
        <Input
          autoFocus
          required
          maxLength={80}
          aria-label={`Rename ${column.name}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-7 w-40 text-xs"
        />
        <Button type="submit" size="xs" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Cancel rename"
          disabled={busy}
          onClick={() => {
            setName(column.name);
            setMode("view");
          }}
        >
          <X />
        </Button>
      </form>
    );
  }

  return (
    <span className="flex items-center gap-0.5 rounded-full border py-0.5 pr-0.5 pl-2.5 text-xs">
      <span className="truncate">{column.name}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Actions for column ${column.name}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => {
              setName(column.name);
              setError(null);
              setMode("rename");
            }}
          >
            <Pencil /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={busy || position <= 0}
            onClick={() => void update({ position: position - 1 })}
          >
            <ChevronLeft /> Move left
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={busy || position >= total - 1}
            onClick={() => void update({ position: position + 1 })}
          >
            <ChevronRight /> Move right
          </DropdownMenuItem>
          {canManage ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={busy}
                onClick={() => void handleDelete(false)}
              >
                <Trash2 /> Delete
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}

/**
 * One board's columns with an inline add-column form, plus a menu to rename
 * or delete the board. The new column's position is the next free integer
 * (the backend requires unique positions per board and rejects conflicts).
 */
function BoardCard({
  workspaceId,
  projectId,
  board,
  canManage,
}: {
  workspaceId: string;
  projectId: string;
  board: Board;
  canManage: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [columnName, setColumnName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Board rename / delete
  const [renaming, setRenaming] = useState(false);
  const [boardName, setBoardName] = useState(board.name);
  const [boardBusy, setBoardBusy] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const columns = [...(board.columns ?? [])].sort(
    (a, b) => a.position - b.position,
  );

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
            position: Math.max(-1, ...columns.map((c) => c.position)) + 1,
          });
        setColumnName("");
        setAdding(false);
      } catch (failure) {
        setError(errorMessage(failure));
      } finally {
        setSubmitting(false);
      }
    },
    [workspaceId, projectId, board.id, columnName, columns],
  );

  const handleRename = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const next = boardName.trim();
      if (!next || next === board.name) {
        setBoardName(board.name);
        setRenaming(false);
        return;
      }
      setBoardBusy(true);
      setBoardError(null);
      try {
        await useProjectsStore
          .getState()
          .updateBoard(workspaceId, projectId, board.id, { name: next });
        setRenaming(false);
      } catch (failure) {
        setBoardError(errorMessage(failure));
      } finally {
        setBoardBusy(false);
      }
    },
    [workspaceId, projectId, board.id, board.name, boardName],
  );

  const handleDelete = useCallback(async () => {
    setBoardBusy(true);
    setBoardError(null);
    try {
      await useProjectsStore
        .getState()
        .deleteBoard(workspaceId, projectId, board.id);
    } catch (failure) {
      setBoardError(errorMessage(failure));
      setBoardBusy(false);
    }
  }, [workspaceId, projectId, board.id]);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        {renaming ? (
          <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
            <Input
              autoFocus
              required
              minLength={2}
              maxLength={100}
              aria-label="Board name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={boardBusy}>
              {boardBusy ? <Loader2 className="animate-spin" /> : "Save"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={boardBusy}
              onClick={() => {
                setBoardName(board.name);
                setRenaming(false);
              }}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-2">
              <Columns3 className="size-4 shrink-0 text-muted-foreground" />
              <Link
                href={`/workspaces/${workspaceId}/projects/${projectId}/boards/${board.id}`}
                className="truncate font-medium hover:underline"
              >
                {board.name}
              </Link>
            </div>
            <div className="flex shrink-0 items-center gap-1">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Actions for board ${board.name}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={() => {
                      setBoardName(board.name);
                      setBoardError(null);
                      setRenaming(true);
                    }}
                  >
                    <Pencil /> Rename board
                  </DropdownMenuItem>
                  {canManage ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setBoardError(null);
                          setConfirmingDelete(true);
                        }}
                      >
                        <Trash2 /> Delete board
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>

      {confirmingDelete ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
          <span>
            Delete this board and all of its columns and tasks? This cannot be
            undone.
          </span>
          <Button
            size="sm"
            variant="destructive"
            disabled={boardBusy}
            onClick={() => void handleDelete()}
          >
            {boardBusy ? <Loader2 className="animate-spin" /> : "Delete board"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={boardBusy}
            onClick={() => setConfirmingDelete(false)}
          >
            Cancel
          </Button>
        </div>
      ) : null}

      {columns.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {columns.map((column, index) => (
            <ColumnChip
              key={column.id}
              workspaceId={workspaceId}
              projectId={projectId}
              boardId={board.id}
              column={column}
              position={index}
              total={columns.length}
              canManage={canManage}
            />
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
      {boardError ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {boardError}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Project detail: the project's boards, each with its columns, plus create
 * forms and per-board/per-column management menus. The workspace id comes from
 * the shared store (the shell only renders children for the matching
 * workspace); the project id is the route param passed down by the server
 * page. Board deletion is offered only to owners and admins, matching the API.
 */
export function ProjectDetailPanel({ projectId }: { projectId: string }) {
  const workspaceId = useWorkspaceStore((s) => s.detail?.id ?? null);
  const detail = useWorkspaceStore((s) => s.detail);
  const user = useAuthStore((s) => s.user);
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
      } catch (failure) {
        setFormError(errorMessage(failure));
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

  const role = detail?.memberships.find((m) => m.userId === user?.id)?.role;
  const canManage = role === "OWNER" || role === "ADMIN";

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
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/workspaces/${workspaceId}/projects/${projectId}/tasks`}
              >
                <ListTodo /> All tasks
              </Link>
            </Button>
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
          </div>
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
                canManage={canManage}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
