"use client";

import { useCallback, useState } from "react";
import { Loader2, Mail, MoreHorizontal, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EDITABLE_ROLES,
  ROLE_BADGE,
  RoleBadge,
} from "@/components/workspace/role-badge";
import { errorMessage } from "@/lib/api/errors";
import { workspacesApi, type MembershipRoleUpdate } from "@/lib/api/workspaces";
import type {
  MembershipWithUser,
  SafeUser,
  WorkspaceRole,
} from "@/lib/api/types";
import { useAuthStore } from "@/lib/stores/auth";
import { useWorkspaceStore } from "@/lib/stores/workspace";

function initialsFor(user: SafeUser): string {
  const source = (user.name ?? user.email).trim();
  const words = source.split(/\s+/);
  if (words.length >= 2 && words[0] && words[1]) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

/**
 * Member list, invitations, role changes, and removal. Reads the workspace
 * from the shared store (the shell only renders children once it is loaded)
 * and patches it after each mutation so the header and sidebar stay in sync.
 */
export function MembersPanel() {
  const currentUser = useAuthStore((s) => s.user);
  const detail = useWorkspaceStore((s) => s.detail);
  const update = useWorkspaceStore((s) => s.update);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState<string | null>(null);

  // Per-member action state
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(
    null,
  );

  const handleInvite = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!detail) return;
      setInviting(true);
      setInviteError(null);
      setInviteSent(null);
      try {
        await workspacesApi.invite(detail.id, {
          email: inviteEmail.trim(),
          role: inviteRole,
        });
        setInviteSent(inviteEmail.trim());
        setInviteEmail("");
        setInviteRole("MEMBER");
      } catch (error) {
        setInviteError(errorMessage(error));
      } finally {
        setInviting(false);
      }
    },
    [detail, inviteEmail, inviteRole],
  );

  const changeRole = useCallback(
    async (member: MembershipWithUser, role: WorkspaceRole) => {
      if (!detail) return;
      setBusyMemberId(member.userId);
      setMemberActionError(null);
      try {
        const updated: MembershipRoleUpdate =
          await workspacesApi.updateMemberRole(detail.id, member.userId, {
            role,
          });
        update((prev) => ({
          ...prev,
          memberships: prev.memberships.map((m) =>
            m.userId === member.userId ? { ...m, role: updated.role } : m,
          ),
        }));
      } catch (error) {
        setMemberActionError(errorMessage(error));
      } finally {
        setBusyMemberId(null);
      }
    },
    [detail, update],
  );

  const removeMember = useCallback(
    async (member: MembershipWithUser) => {
      if (!detail) return;
      setBusyMemberId(member.userId);
      setMemberActionError(null);
      try {
        await workspacesApi.removeMember(detail.id, member.userId);
        update((prev) => ({
          ...prev,
          memberships: prev.memberships.filter(
            (m) => m.userId !== member.userId,
          ),
        }));
      } catch (error) {
        setMemberActionError(errorMessage(error));
      } finally {
        setBusyMemberId(null);
      }
    },
    [detail, update],
  );

  if (!detail) {
    return (
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const members = detail.memberships;
  const currentMembership = members.find((m) => m.userId === currentUser?.id);
  const currentRole = currentMembership?.role;
  const canManage = currentRole === "OWNER" || currentRole === "ADMIN";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>
          {members.length}{" "}
          {members.length === 1 ? "person has" : "people have"} access to this
          workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {memberActionError ? (
          <p className="text-sm text-destructive" role="alert">
            {memberActionError}
          </p>
        ) : null}

        <ul className="divide-y">
          {members.map((member) => {
            const isSelf = member.userId === currentUser?.id;
            const isOwner = member.role === "OWNER";
            const busy = busyMemberId === member.userId;
            return (
              <li key={member.userId} className="flex items-center gap-3 py-3">
                <Avatar>
                  <AvatarFallback className="text-xs">
                    {initialsFor(member.user)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.user.name || member.user.email}
                    {isSelf ? (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        (you)
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {busy ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : null}

                  {isOwner || !canManage ? (
                    <RoleBadge role={member.role} />
                  ) : (
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        changeRole(member, value as WorkspaceRole)
                      }
                    >
                      <SelectTrigger className="h-8 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EDITABLE_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_BADGE[role].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {canManage && !isOwner && !isSelf ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Actions for ${
                            member.user.name || member.user.email
                          }`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>Remove access</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => removeMember(member)}
                        >
                          <Trash2 />
                          Remove from workspace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Invite form */}
        {canManage ? (
          <>
            <Separator />
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">Invite someone</p>
              </div>
              {inviteError ? (
                <p className="text-sm text-destructive" role="alert">
                  {inviteError}
                </p>
              ) : null}
              {inviteSent ? (
                <p className="text-sm text-green-600" role="status">
                  Invitation sent to {inviteSent}. They will receive an email
                  with an acceptance link.
                </p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  required
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={inviteRole}
                  onValueChange={(value) => setInviteRole(value as WorkspaceRole)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDITABLE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_BADGE[role].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={inviting}>
                  {inviting ? <Loader2 className="animate-spin" /> : "Send invite"}
                </Button>
              </div>
            </form>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
