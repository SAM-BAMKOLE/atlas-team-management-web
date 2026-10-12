import { apiFetch } from "./client";
import type {
  Comment,
  CreateCommentInput,
  CreateTaskInput,
  MoveTaskInput,
  ProjectTask,
  SuccessResponse,
  Task,
  TaskBasic,
  UpdateTaskInput,
} from "./types";

/**
 * Task endpoints, scoped to one board. The backend verifies the whole
 * workspace → project → board → task chain on every call. Listing defaults to
 * non-archived tasks ordered by column, then position; pass `archived: true`
 * to get the archived ones.
 */
export const tasksApi = {
  list: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    archived = false,
  ) =>
    apiFetch<Task[]>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks${
        archived ? "?archived=true" : ""
      }`,
    ),

  /** Tasks of every board in a project — the project "Tasks" page. */
  listProject: (
    workspaceId: string,
    projectId: string,
    archived = false,
  ) =>
    apiFetch<ProjectTask[]>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks${
        archived ? "?archived=true" : ""
      }`,
    ),

  /** One task by id, archived or not — deep links to archived tasks. */
  get: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
  ) =>
    apiFetch<Task>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}`,
    ),

  create: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    input: CreateTaskInput,
  ) =>
    apiFetch<Task>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks`,
      { method: "POST", body: input },
    ),

  update: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
    input: UpdateTaskInput,
  ) =>
    apiFetch<Task>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}`,
      { method: "PATCH", body: input },
    ),

  /**
   * Soft-deletes the task (the backend sets `archived: true`). Archived tasks
   * disappear from the board list but keep their comments, labels, and
   * assignees; `restore` brings one back.
   */
  remove: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
  ) =>
    apiFetch<Task>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}`,
      { method: "DELETE" },
    ),

  /** Restores an archived task so it reappears on the board. */
  restore: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
  ) =>
    apiFetch<Task>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}`,
      { method: "PATCH", body: { archived: false } },
    ),

  /**
   * Permanently deletes a task (owners/admins only). The backend cascades
   * to comments, assignees, labels, and activity.
   */
  purge: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
  ) =>
    apiFetch<SuccessResponse>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/permanent`,
      { method: "DELETE" },
    ),

  move: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
    input: MoveTaskInput,
  ) =>
    apiFetch<TaskBasic>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/move`,
      { method: "POST", body: input },
    ),

  comments: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
  ) =>
    apiFetch<Comment[]>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/comments`,
    ),

  addComment: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
    input: CreateCommentInput,
  ) =>
    apiFetch<Comment>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/comments`,
      { method: "POST", body: input },
    ),

  assign: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
    userId: string,
  ) =>
    apiFetch<SuccessResponse>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/assignees/${userId}`,
      { method: "PUT" },
    ),

  unassign: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
    userId: string,
  ) =>
    apiFetch<SuccessResponse>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/assignees/${userId}`,
      { method: "DELETE" },
    ),

  addLabel: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
    labelId: string,
  ) =>
    apiFetch<SuccessResponse>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/labels/${labelId}`,
      { method: "PUT" },
    ),

  removeLabel: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
    labelId: string,
  ) =>
    apiFetch<SuccessResponse>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks/${taskId}/labels/${labelId}`,
      { method: "DELETE" },
    ),
};
