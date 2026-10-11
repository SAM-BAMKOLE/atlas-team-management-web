"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api/errors";
import type { Column, Task } from "@/lib/api/types";
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
 * Kanban board: one lane per column (columns come from the project detail),
 * task cards ordered by position, inline task creation, and left/right move
 * controls that shift a card into the adjacent lane at the top. Priority,
 * labels, and due dates render read-only here — editing lives on the task
 * detail page.
 */
function TaskCard({
  task,
  columnIds,
  detailHref,
  onMove,
  moving,
}: {
  task: Task;
  columnIds: string[];
  detailHref: string;
  onMove: (task: Task, dir: -1 | 1) => void;
  moving: boolean;
}) {
  const laneIndex = columnIds.indexOf(task.columnId);
  const labels = task.labels.map((assignment) => assignment.label);

  return (
    <div className="rounded-md border bg-card p-3 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span
            className={`mt-1.5 size-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
            aria-label={`Priority ${task.priority.toLowerCase()}`}
          />
          <Link
            href={detailHref}
            className="break-words text-sm hover:underline"
          >
            {task.title}
          </Link>
        </div>
        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            disabled={moving || laneIndex <= 0}
            aria-label={`Move ${task.title} left`}
            onClick={() => onMove(task, -1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            disabled={moving || laneIndex >= columnIds.length - 1}
            aria-label={`Move ${task.title} right`}
            onClick={() => onMove(task, 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      {labels.length > 0 || task.dueDate || task.assignees.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-4">
          {labels.map((label) => (
            <span
              key={label.id}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              {label.name}
            </span>
          ))}
          {task.dueDate ? (
            <span
              className={`text-xs ${isOverdue(task.dueDate) ? "text-destructive" : "text-muted-foreground"}`}
            >
              {dueLabel(task.dueDate)}
            </span>
          ) : null}
          {task.assignees.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              {task.assignees.length === 1
                ? "1 assignee"
                : `${task.assignees.length} assignees`}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function BoardPanel({
  projectId,
  boardId,
}: {
  projectId: string;
  boardId: string;
}) {
  const workspaceId = useWorkspaceStore((s) => s.detail?.id ?? null);
  const active = useProjectsStore((s) => s.active);
  const projectStatus = useProjectsStore((s) => s.activeStatus);
  const projectError = useProjectsStore((s) => s.activeError);
  const loadActive = useProjectsStore((s) => s.loadActive);
  const tasks = useBoardStore((s) => s.tasks);
  const tasksStatus = useBoardStore((s) => s.status);
  const tasksError = useBoardStore((s) => s.error);
  const loadTasks = useBoardStore((s) => s.load);

  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    void loadActive(workspaceId, projectId);
    void loadTasks(workspaceId, projectId, boardId);
  }, [workspaceId, projectId, boardId, loadActive, loadTasks]);

  const handleCreate = useCallback(
    async (column: Column) => {
      if (!workspaceId || !draft.trim()) return;
      setSubmitting(true);
      setFormError(null);
      try {
        const columnTasks = tasks.filter((t) => t.columnId === column.id);
        await useBoardStore
          .getState()
          .create(workspaceId, projectId, boardId, {
            title: draft.trim(),
            columnId: column.id,
            position:
              Math.max(-1, ...columnTasks.map((t) => t.position)) + 1,
          });
        setDraft("");
        setAddingTo(null);
      } catch (error) {
        setFormError(errorMessage(error));
      } finally {
        setSubmitting(false);
      }
    },
    [workspaceId, projectId, boardId, draft, tasks],
  );

  const handleMove = useCallback(
    (task: Task, dir: -1 | 1) => {
      if (!workspaceId || !active) return;
      const columns = [...active.boards.find((b) => b.id === boardId)?.columns ?? []]
        .sort((a, b) => a.position - b.position);
      const index = columns.findIndex((c) => c.id === task.columnId);
      const target = columns[index + dir];
      if (!target) return;
      setMovingId(task.id);
      void useBoardStore
        .getState()
        .move(workspaceId, projectId, boardId, task.id, {
          columnId: target.id,
          position: 0,
        })
        .catch((error) => setFormError(errorMessage(error)))
        .finally(() => setMovingId(null));
    },
    [workspaceId, active, projectId, boardId],
  );

  const loading =
    !workspaceId ||
    (projectStatus === "loading" && !active) ||
    (tasksStatus === "loading" && tasks.length === 0);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-72 w-72 shrink-0" />
        ))}
      </div>
    );
  }

  if (projectStatus === "error") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load board</CardTitle>
          <p className="text-sm text-muted-foreground">
            {projectError ?? "Something went wrong."}
          </p>
        </CardHeader>
      </Card>
    );
  }

  const project =
    active?.id === projectId ? active : null;
  const board = project?.boards.find((b) => b.id === boardId);

  if (!project || !board) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Board not found</CardTitle>
          <p className="text-sm text-muted-foreground">
            It may have been removed from this project.
          </p>
        </CardHeader>
      </Card>
    );
  }

  const columns = [...(board.columns ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const columnIds = columns.map((c) => c.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/workspaces/${workspaceId}/projects/${projectId}`}>
              <ArrowLeft /> {project.name}
            </Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <h2 className="truncate text-lg font-semibold">{board.name}</h2>
        </div>
      </div>
      {formError ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
      {tasksStatus === "error" && tasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Could not load tasks</CardTitle>
            <p className="text-sm text-muted-foreground">
              {tasksError ?? "Something went wrong."}
            </p>
          </CardHeader>
        </Card>
      ) : columns.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No columns yet</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add columns to this board from the project page.
            </p>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {columns.map((column) => {
            const columnTasks = tasks
              .filter((t) => t.columnId === column.id)
              .sort((a, b) => a.position - b.position);
            return (
              <div
                key={column.id}
                className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/40 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="truncate text-sm font-medium">
                    {column.name}
                  </span>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {columnTasks.length}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      columnIds={columnIds}
                      detailHref={`/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${task.id}`}
                      onMove={handleMove}
                      moving={movingId === task.id}
                    />
                  ))}
                </div>
                {addingTo === column.id ? (
                  <form
                    className="mt-2 flex gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleCreate(column);
                    }}
                  >
                    <Input
                      autoFocus
                      required
                      maxLength={200}
                      placeholder="Task title"
                      aria-label={`New task in ${column.name}`}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="secondary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </form>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 justify-start text-muted-foreground"
                    onClick={() => {
                      setFormError(null);
                      setDraft("");
                      setAddingTo(column.id);
                    }}
                  >
                    <Plus /> Add task
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
