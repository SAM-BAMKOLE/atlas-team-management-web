import { apiFetch } from "./client";
import type {
  AcceptInvitationResponse,
  CreateInvitationInput,
  CreateWorkspaceInput,
  Invitation,
  Membership,
  MembershipWithUser,
  SuccessResponse,
  UpdateMemberRoleInput,
  UpdateWorkspaceInput,
  Workspace,
  WorkspaceDetail,
  WorkspaceRole,
} from "./types";

/** Flat membership row returned by the role-update endpoint (no nesting). */
export interface MembershipRoleUpdate {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * Workspace, membership, and invitation endpoints.
 * Role-gated mutations (update, member roles, remove, invite) require
 * OWNER or ADMIN; the backend returns 403 otherwise.
 */
export const workspacesApi = {
  list: () => apiFetch<Membership[]>("/workspaces"),

  detail: (workspaceId: string) =>
    apiFetch<WorkspaceDetail>(`/workspaces/${workspaceId}`),

  create: (input: CreateWorkspaceInput) =>
    apiFetch<Workspace>("/workspaces", { method: "POST", body: input }),

  update: (workspaceId: string, input: UpdateWorkspaceInput) =>
    apiFetch<Workspace>(`/workspaces/${workspaceId}`, {
      method: "PATCH",
      body: input,
    }),

  updateMemberRole: (
    workspaceId: string,
    userId: string,
    input: UpdateMemberRoleInput,
  ) =>
    apiFetch<MembershipRoleUpdate>(
      `/workspaces/${workspaceId}/members/${userId}/role`,
      { method: "PATCH", body: input },
    ),

  removeMember: (workspaceId: string, userId: string) =>
    apiFetch<SuccessResponse>(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "DELETE",
    }),

  invite: (workspaceId: string, input: CreateInvitationInput) =>
    apiFetch<Invitation>(`/workspaces/${workspaceId}/invitations`, {
      method: "POST",
      body: input,
    }),

  acceptInvitation: (token: string) =>
    apiFetch<AcceptInvitationResponse>("/invitations/accept", {
      method: "POST",
      body: { token },
    }),
};
