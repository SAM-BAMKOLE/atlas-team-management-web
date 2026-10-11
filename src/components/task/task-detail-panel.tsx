"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Archive, Loader2, Pencil, Plus, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/api/errors";
import type {
  Comment,
  Label,
  MembershipWithUser,
  Task,
  TaskPriority,
} from "@/lib/api/types";
import { labelsApi } from "@/lib/api/labels";
import { tasksApi } from "@/lib/api/tasks";
import { useBoardStore } from "@/lib/stores/board";
import { useWorkspaceStore } from "@/lib/stores/workspace";
import { PRIORITY_DOT, PRIORITY_LABEL } from "./priority";

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

/**
 * Stable empty fallback so the selector below returns the same reference on
 * every render while the workspace detail is still loading (a fresh `[]`
 * literal would trip useSyncExternalStore into an infinite loop).
 */
const NO_MEMBERS: MembershipWithUser[] = [];

/** Same stable-fallback rationale as `NO_MEMBERS`, for workspace labels. */
const NO_LABELS: Label[] = [];

function initials(name: string | null): string {
  return (name ?? "?")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function commentTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dueLabel(dueDate: string): string {
  return new Date(dueDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate).getTime() < Date.now();
}

/**
 * Full task view: inline editing of title, description, priority, and due
 * date; assignment from workspace members; archiving; and a comment thread.
 * The task itself comes from the board store (there is no single-task GET —
 * the board list is fetched and the task picked by id).
 */
export function TaskDetailPanel({
  projectId,
  boardId,
  taskId,
}: {
  projectId: string;
  boardId: string;
  taskId: string;
}) {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((s) => s.detail?.id ?? null);
  const members = useWorkspaceStore(
    (s) => s.detail?.memberships ?? NO_MEMBERS,
  );
  const task = useBoardStore(
    (s) => s.tasks.find((t) => t.id === taskId) ?? null,
  );
  const boardStatus = useBoardStore((s) => s.status);
  const boardError = useBoardStore((s) => s.error);
  const loadTasks = useBoardStore((s) => s.load);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [assigning, setAssigning] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsStatus, setCommentsStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  // Workspace labels, for the attach picker (task.labels holds the applied ones).
  const [workspaceLabels, setWorkspaceLabels] = useState<Label[]>(NO_LABELS);
  const [labeling, setLabeling] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    labelsApi
      .list(workspaceId)
      .then(setWorkspaceLabels)
      .catch(() => setWorkspaceLabels(NO_LABELS));
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    void loadTasks(workspaceId, projectId, boardId);
  }, [workspaceId, projectId, boardId, loadTasks]);

  useEffect(() => {
    if (!workspaceId || !task) return;
    setCommentsStatus("loading");
    tasksApi
      .comments(workspaceId, projectId, boardId, taskId)
      .then((list) => {
        setComments(list);
        setCommentsStatus("ready");
      })
      .catch((error) => {
        setCommentsError(errorMessage(error));
        setCommentsStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, task?.id]);

  const startEditing = () => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setFormError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!workspaceId || !task || !title.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const updated = await tasksApi.update(workspaceId, projectId, boardId, taskId, {
        title: title.trim(),
        description,
        priority,
        dueDate: dueDate
          ? new Date(`${dueDate}T00:00:00.000Z`).toISOString()
          : null,
      });
      useBoardStore.setState((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
      }));
      setEditing(false);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!workspaceId || !task) return;
    setArchiving(true);
    setFormError(null);
    try {
      await tasksApi.update(workspaceId, projectId, boardId, taskId, {
        archived: true,
      });
      useBoardStore.setState((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
      }));
      router.push(
        `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}`,
      );
    } catch (error) {
      setFormError(errorMessage(error));
      setArchiving(false);
    }
  };

  const handleAssign = async (userId: string) => {
    if (!workspaceId || !task) return;
    const member = members.find((m) => m.userId === userId);
    if (!member) return;
    setAssigning(true);
    setFormError(null);
    try {
      await tasksApi.assign(workspaceId, projectId, boardId, taskId, userId);
      useBoardStore.setState((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                assignees: [
                  ...t.assignees,
                  {
                    taskId,
                    userId,
                    assignedAt: new Date().toISOString(),
                    user: member.user,
                  },
                ],
              }
            : t,
        ),
      }));
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (userId: string) => {
    if (!workspaceId || !task) return;
    setFormError(null);
    try {
      await tasksApi.unassign(workspaceId, projectId, boardId, taskId, userId);
      useBoardStore.setState((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? { ...t, assignees: t.assignees.filter((a) => a.userId !== userId) }
            : t,
        ),
      }));
    } catch (error) {
      setFormError(errorMessage(error));
    }
  };

  const handleAddLabel = async (labelId: string) => {
    if (!workspaceId || !task) return;
    const label = workspaceLabels.find((l) => l.id === labelId);
    if (!label) return;
    setLabeling(true);
    setFormError(null);
    try {
      await tasksApi.addLabel(workspaceId, projectId, boardId, taskId, labelId);
      useBoardStore.setState((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                labels: [
                  ...t.labels,
                  {
                    taskId,
                    labelId,
                    assignedAt: new Date().toISOString(),
                    label,
                  },
                ],
              }
            : t,
        ),
      }));
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setLabeling(false);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    if (!workspaceId || !task) return;
    setFormError(null);
    try {
      await tasksApi.removeLabel(
        workspaceId,
        projectId,
        boardId,
        taskId,
        labelId,
      );
      useBoardStore.setState((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? { ...t, labels: t.labels.filter((l) => l.labelId !== labelId) }
            : t,
        ),
      }));
    } catch (error) {
      setFormError(errorMessage(error));
    }
  };

  const handleComment = async () => {
    if (!workspaceId || !task || !draft.trim()) return;
    setPosting(true);
    setFormError(null);
    try {
      const comment = await tasksApi.addComment(
        workspaceId,
        projectId,
        boardId,
        taskId,
        { body: draft.trim() },
      );
      setComments((prev) => [...prev, comment]);
      setDraft("");
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setPosting(false);
    }
  };

  const boardHref = `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}`;

  if (!workspaceId || (!task && (boardStatus === "loading" || boardStatus === "idle"))) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!task && boardStatus === "error") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load task</CardTitle>
          <CardDescription>{boardError ?? "Something went wrong."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task not found</CardTitle>
          <CardDescription>
            It may have been archived, or the link is out of date.
          </CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href={boardHref}>
                <ArrowLeft /> Back to board
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    );
  }

  const labels = task.labels.map((assignment) => assignment.label);
  const unassigned = members.filter(
    (m) => !task.assignees.some((a) => a.userId === m.userId),
  );
  const unlabeled = workspaceLabels.filter(
    (l) => !task.labels.some((assignment) => assignment.labelId === l.id),
  );

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={boardHref}>
          <ArrowLeft /> Back to board
        </Link>
      </Button>
      {formError ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              {editing ? (
                <div className="space-y-3 py-1">
                  <Input
                    required
                    maxLength={200}
                    aria-label="Task title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Textarea
                    maxLength={5000}
                    placeholder="Description"
                    aria-label="Task description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Priority
                      </span>
                      <Select
                        value={priority}
                        onValueChange={(v) => setPriority(v as TaskPriority)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {PRIORITY_LABEL[p]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Due date
                      </span>
                      <Input
                        type="date"
                        aria-label="Due date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={saving || !title.trim()} onClick={() => void handleSave()}>
                      {saving ? <Loader2 className="animate-spin" /> : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <CardAction>
                    <Button variant="outline" size="sm" onClick={startEditing}>
                      <Pencil /> Edit
                    </Button>
                  </CardAction>
                </>
              )}
            </CardHeader>
            {!editing ? (
              <CardContent className="space-y-3">
                {task.description ? (
                  <p className="text-sm whitespace-pre-wrap">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description.
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`size-2 rounded-full ${PRIORITY_DOT[task.priority]}`}
                    />
                    {PRIORITY_LABEL[task.priority]}
                  </span>
                  {task.dueDate ? (
                    <span
                      className={
                        isOverdue(task.dueDate) ? "text-destructive" : undefined
                      }
                    >
                      Due {dueLabel(task.dueDate)}
                    </span>
                  ) : null}
                  {labels.map((label) => (
                    <span key={label.id} className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            ) : null}
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                Comments
                {commentsStatus === "ready" && comments.length > 0
                  ? ` (${comments.length})`
                  : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {commentsStatus === "loading" ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : commentsStatus === "error" ? (
                <p className="text-sm text-destructive">{commentsError}</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                <ul className="space-y-3">
                  {comments.map((comment) => (
                    <li key={comment.id} className="flex gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback>
                          {initials(comment.author.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {comment.author.name} · {commentTime(comment.createdAt)}
                        </p>
                        <p className="text-sm break-words whitespace-pre-wrap">
                          {comment.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleComment();
                }}
              >
                <Textarea
                  maxLength={5000}
                  placeholder="Write a comment…"
                  aria-label="New comment"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={posting || !draft.trim()}
                >
                  {posting ? <Loader2 className="animate-spin" /> : "Send"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.assignees.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nobody assigned.</p>
              ) : (
                <ul className="space-y-2">
                  {task.assignees.map((assignee) => (
                    <li key={assignee.userId} className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback>
                          {initials(assignee.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{assignee.user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {assignee.user.email}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Unassign ${assignee.user.name}`}
                        onClick={() => void handleUnassign(assignee.userId)}
                      >
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {unassigned.length > 0 ? (
                <Select
                  value=""
                  disabled={assigning}
                  onValueChange={(v) => void handleAssign(v)}
                >
                  <SelectTrigger className="w-full">
                    <Plus /> Assign member
                  </SelectTrigger>
                  <SelectContent>
                    {unassigned.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Labels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.labels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No labels.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {task.labels.map((assignment) => (
                    <span
                      key={assignment.labelId}
                      className="flex items-center gap-1.5 rounded-full border py-0.5 pr-1 pl-2.5 text-xs"
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: assignment.label.color }}
                      />
                      {assignment.label.name}
                      <button
                        type="button"
                        aria-label={`Remove label ${assignment.label.name}`}
                        className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                        onClick={() => void handleRemoveLabel(assignment.labelId)}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {unlabeled.length > 0 ? (
                <Select
                  value=""
                  disabled={labeling}
                  onValueChange={(v) => void handleAddLabel(v)}
                >
                  <SelectTrigger className="w-full">
                    <Plus /> Add label
                  </SelectTrigger>
                  <SelectContent>
                    {unlabeled.map((label) => (
                      <SelectItem key={label.id} value={label.id}>
                        {label.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Task status</CardTitle>
              <CardDescription>
                Archived tasks disappear from the board.
              </CardDescription>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={archiving}
                  onClick={() => void handleArchive()}
                >
                  {archiving ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Archive /> Archive
                    </>
                  )}
                </Button>
              </CardAction>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
