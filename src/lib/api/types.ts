/**
 * API types for the Atlas backend.
 * Verified against the running API (localhost:3001) on 2026-10-09.
 */

// ---------- Auth ----------

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  emailVerifiedAt: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

export interface RefreshResponse {
  /** Freshly signed access token (added by the backend on 2026-10-09). */
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface MessageResponse {
  message: string;
}

export interface SuccessResponse {
  success: boolean;
}

// ---------- Workspaces ----------

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

/** Membership shape returned by `GET /workspaces` (nested workspace). */
export interface Membership {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
  workspace: Workspace;
}

/** Membership shape returned by `GET /workspaces/:id` (nested user). */
export interface MembershipWithUser {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
  user: SafeUser;
}

export interface WorkspaceDetail extends Workspace {
  memberships: MembershipWithUser[];
}

export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
}

export interface UpdateWorkspaceInput {
  name: string;
}

export interface UpdateMemberRoleInput {
  role: WorkspaceRole;
}

export interface CreateInvitationInput {
  email: string;
  role: WorkspaceRole;
}

export interface Invitation {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  emailJobId: string;
}

export interface AcceptInvitationInput {
  token: string;
}

export interface AcceptInvitationResponse {
  workspaceId: string;
  role: WorkspaceRole;
}

// ---------- Projects, boards, columns ----------

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  /** Included by project detail, omitted in the project list. */
  columns?: Column[];
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  boards: Board[];
}

export interface CreateProjectInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  archived?: boolean;
}

export interface CreateBoardInput {
  name: string;
}

export interface CreateColumnInput {
  name: string;
  position: number;
}

export interface UpdateBoardInput {
  name: string;
}

export interface UpdateColumnInput {
  name?: string;
  position?: number;
}

// ---------- Tasks ----------

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskAssignee {
  taskId: string;
  userId: string;
  assignedAt: string;
  user: SafeUser;
}

export interface TaskLabelAssignment {
  taskId: string;
  labelId: string;
  assignedAt: string;
  label: Label;
}

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  position: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  assignees: TaskAssignee[];
  labels: TaskLabelAssignment[];
}

/** A task from the project-scoped list, which adds its board and column names. */
export interface ProjectTask extends Task {
  board: { id: string; name: string };
  column: { id: string; name: string };
}

/** The "basic record" returned by move (no assignees or labels). */
export type TaskBasic = Omit<Task, "assignees" | "labels">;

export interface CreateTaskInput {
  title: string;
  columnId: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  position?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  archived?: boolean;
}

export interface MoveTaskInput {
  columnId: string;
  position: number;
}

// ---------- Comments ----------

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: SafeUser;
}

export interface CreateCommentInput {
  body: string;
}

// ---------- Labels ----------

export interface Label {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabelInput {
  name: string;
  color: string;
}

// ---------- Activity ----------

export type ActivityType =
  | "COMMENT_ADDED"
  | "LABEL_ADDED"
  | "LABEL_REMOVED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_MOVED"
  | "TASK_ASSIGNED"
  | "TASK_UNASSIGNED";

export interface ActivityEvent {
  id: string;
  workspaceId: string;
  taskId: string;
  actorId: string;
  type: ActivityType;
  metadata: Record<string, string> | null;
  createdAt: string;
  actor: SafeUser;
}
