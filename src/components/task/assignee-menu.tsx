"use client";

import { useState, type ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { errorMessage } from "@/lib/api/errors";
import type { MembershipWithUser, TaskAssignee } from "@/lib/api/types";
import { tasksApi } from "@/lib/api/tasks";

export function initials(name: string | null | undefined): string {
  return (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Quick assign/unassign menu: one entry per workspace member, with a check on
 * those already assigned. Toggling calls the assign/unassign endpoint and
 * leaves the menu open so several people can be assigned in a row. The parent
 * receives `onChange(userId, assigned)` after each successful call and is
 * responsible for keeping its own task state in sync.
 */
export function AssigneeMenu({
  workspaceId,
  projectId,
  boardId,
  taskId,
  assignees,
  members,
  onChange,
  trigger,
  align = "start",
}: {
  workspaceId: string;
  projectId: string;
  boardId: string;
  taskId: string;
  assignees: TaskAssignee[];
  members: MembershipWithUser[];
  onChange: (userId: string, assigned: boolean) => void;
  trigger: ReactNode;
  align?: "start" | "end";
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = async (userId: string) => {
    const assigned = assignees.some((a) => a.userId === userId);
    setBusyId(userId);
    setError(null);
    try {
      if (assigned) {
        await tasksApi.unassign(
          workspaceId,
          projectId,
          boardId,
          taskId,
          userId,
        );
      } else {
        await tasksApi.assign(workspaceId, projectId, boardId, taskId, userId);
      }
      onChange(userId, !assigned);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) setError(null);
      }}
    >
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Assign to
        </div>
        {members.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            No workspace members yet.
          </div>
        ) : (
          members.map((member) => {
            const assigned = assignees.some(
              (a) => a.userId === member.userId,
            );
            return (
              <DropdownMenuItem
                key={member.userId}
                disabled={busyId === member.userId}
                onSelect={(event) => {
                  event.preventDefault();
                  void toggle(member.userId);
                }}
              >
                <Avatar size="sm">
                  <AvatarFallback>
                    {initials(member.user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {member.user.name ?? member.user.email}
                </span>
                {busyId === member.userId ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : assigned ? (
                  <Check className="size-4 text-primary" />
                ) : null}
              </DropdownMenuItem>
            );
          })
        )}
        {error ? (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-destructive" role="alert">
              {error}
            </div>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}