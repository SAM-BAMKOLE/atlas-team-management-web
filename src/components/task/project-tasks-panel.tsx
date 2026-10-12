"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  Columns3,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api/errors";
import type { ProjectTask } from "@/lib/api/types";
import { tasksApi } from "@/lib/api/tasks";
import { useAuthStore } from "@/lib/stores/auth";
import { useBoardStore } from "@/lib/stores/board";
import { useProjectsStore } from "@/lib/stores/projects";
import { useWorkspaceStore } from "@/lib/stores/workspace";
import { PRIORITY_DOT } from "@/components/task/priority";

function dueLabel(dueDate: string): string {
  return new Date(dueDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate).getTime() < Date.now();
}

/**
 * The project "Tasks" page: every task across the project's boards, in a
 * flat active list grouped by board, plus an archived tab where tasks can be
 * restored or permanently deleted (owners/admins). Restore and purge go
 * through the board store so kanban boards stay in sync without refetching.
 */
export function ProjectTasksPanel({ projectId }: { projectId: string }) {
  const workspaceId = useWorkspaceStore((s) => s.detail?.id ?? null);
  const detail = useWorkspaceStore((s) => s.detail);
  const user = useAuthStore((s) => s.user);
  const active = useProjectsStore((s) => s.active);
  const projectStatus = useProjectsStore((s) => s.activeStatus);
  const projectError = useProjectsStore((s) => s.activeError);
  const loadActive = useProjectsStore((s) => s.loadActive);

  const [tab, setTab] = useState<"active" | "archived">("active");
  const [activeTasks, setActiveTasks] = useState<ProjectTask[] | null>(null);
  const [archivedTasks, setArchivedTasks] = useState<ProjectTask[] | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [purgeConfirmId, setPurgeConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    void loadActive(workspaceId, projectId);
  }, [workspaceId, projectId, loadActive]);

  // The lists load lazily: active on mount, archived on first tab visit.
  useEffect(() => {
    if (!workspaceId || activeTasks !== null) return;
    tasksApi
      .listProject(workspaceId, projectId, false)
      .then(setActiveTasks)
      .catch((failure) => setLoadError(errorMessage(failure)));
  }, [workspaceId, projectId, activeTasks]);

  useEffect(() => {
    if (!workspaceId || tab !== "archived" || archivedTasks !== null) return;
    tasksApi
      .listProject(workspaceId, projectId, true)
      .then(setArchivedTasks)
      .catch((failure) => setLoadError(errorMessage(failure)));
  }, [workspaceId, projectId, tab, archivedTasks]);

  const myRole = detail?.memberships.find((m) => m.userId === user?.id)?.role;
  const canManage = myRole === "OWNER" || myRole === "ADMIN";

  const project = active?.id === projectId ? active : null;
  const boards = project?.boards ?? [];

  const handleRestore = async (task: ProjectTask) => {
    if (!workspaceId) return;
    setBusyId(task.id);
    setLoadError(null);
    try {
      await useBoardStore
        .getState()
        .restore(workspaceId, projectId, task.boardId, task.id);
      setArchivedTasks((prev) =>
        prev ? prev.filter((t) => t.id !== task.id) : prev,
      );
      setActiveTasks((prev) =>
        prev ? [...prev, { ...task, archived: false }] : prev,
      );
    } catch (failure) {
      setLoadError(errorMessage(failure));
    } finally {
      setBusyId(null);
    }
  };

  const handlePurge = async (task: ProjectTask) => {
    if (!workspaceId) return;
    setBusyId(task.id);
    setLoadError(null);
    try {
      await useBoardStore
        .getState()
        .purge(workspaceId, projectId, task.boardId, task.id);
      setArchivedTasks((prev) =>
        prev ? prev.filter((t) => t.id !== task.id) : prev,
      );
      setActiveTasks((prev) =>
        prev ? prev.filter((t) => t.id !== task.id) : prev,
      );
      setPurgeConfirmId(null);
    } catch (failure) {
      setLoadError(errorMessage(failure));
    } finally {
      setBusyId(null);
    }
  };

  const tasks = tab === "active" ? activeTasks : archivedTasks;
  const loading =
    !workspaceId ||
    (projectStatus === "loading" && !active) ||
    (tasks === null && !loadError);

  const projectHref = `/workspaces/${workspaceId}/projects/${projectId}`;

  if (!workspaceId || loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (projectStatus === "error" || !project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load project</CardTitle>
          <CardDescription>
            {projectError ?? "Something went wrong."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={projectHref}>
              <ArrowLeft /> {project.name}
            </Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <h2 className="truncate text-lg font-semibold">All tasks</h2>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <Button
            size="sm"
            variant={tab === "active" ? "secondary" : "ghost"}
            onClick={() => {
              setLoadError(null);
              setTab("active");
            }}
          >
            Active
            {activeTasks !== null ? ` (${activeTasks.length})` : ""}
          </Button>
          <Button
            size="sm"
            variant={tab === "archived" ? "secondary" : "ghost"}
            onClick={() => {
              setLoadError(null);
              setTab("archived");
            }}
          >
            <Archive /> Archived
            {archivedTasks !== null ? ` (${archivedTasks.length})` : ""}
          </Button>
        </div>
      </div>
      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}
      {tab === "active" ? (
        activeTasks && activeTasks.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No tasks yet</CardTitle>
              <CardDescription>
                Create tasks from a task board to see them here.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            {boards.map((board) => {
              const columns = [...(board.columns ?? [])].sort(
                (a, b) => a.position - b.position,
              );
              const rows = columns.flatMap((column) =>
                (activeTasks ?? [])
                  .filter((t) => t.columnId === column.id)
                  .sort((a, b) => a.position - b.position)
                  .map((task) => ({ task, column })),
              );
              if (rows.length === 0) return null;
              return (
                <section key={board.id} className="space-y-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Columns3 className="size-4 text-muted-foreground" />
                    {board.name}
                    <Badge variant="secondary">{rows.length}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {rows.map(({ task, column }) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 rounded-md border bg-card p-3 shadow-xs"
                      >
                        <span
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
                          aria-label={`Priority ${task.priority.toLowerCase()}`}
                        />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`${projectHref}/boards/${task.boardId}/tasks/${task.id}`}
                            className="break-words text-sm hover:underline"
                          >
                            {task.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {column.name}
                            {task.dueDate ? (
                              <span
                                className={
                                  isOverdue(task.dueDate)
                                    ? "text-destructive"
                                    : undefined
                                }
                              >
                                {" "}
                                · Due {dueLabel(task.dueDate)}
                              </span>
                            ) : null}
                            {task.assignees.length > 0 ? (
                              <span>
                                {" "}
                                ·{" "}
                                {task.assignees.length === 1
                                  ? "1 assignee"
                                  : `${task.assignees.length} assignees`}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )
      ) : archivedTasks !== null && archivedTasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No archived tasks</CardTitle>
            <CardDescription>
              Archived tasks from any board land here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="divide-y rounded-md border bg-card">
          {archivedTasks?.map((task) => (
            <li key={task.id} className="flex flex-wrap items-center gap-3 py-3 pl-3 pr-2">
              <div className="min-w-0 flex-1">
                <Link
                  href={`${projectHref}/boards/${task.boardId}/tasks/${task.id}`}
                  className="text-sm hover:underline"
                >
                  {task.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {task.board.name} · {task.column.name}
                  {task.dueDate ? ` · Due ${dueLabel(task.dueDate)}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === task.id}
                onClick={() => void handleRestore(task)}
              >
                {busyId === task.id ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <RotateCcw />
                )}
                Restore
              </Button>
              {canManage ? (
                purgeConfirmId === task.id ? (
                  <span className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === task.id}
                      onClick={() => void handlePurge(task)}
                    >
                      Delete forever
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === task.id}
                      onClick={() => setPurgeConfirmId(null)}
                    >
                      Cancel
                    </Button>
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setPurgeConfirmId(task.id)}
                  >
                    <Trash2 /> Delete
                  </Button>
                )
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}