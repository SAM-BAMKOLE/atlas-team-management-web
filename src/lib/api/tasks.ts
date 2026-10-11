import { apiFetch } from "./client";
import type {
  Comment,
  CreateCommentInput,
  CreateTaskInput,
  MoveTaskInput,
  SuccessResponse,
  Task,
  TaskBasic,
  UpdateTaskInput,
} from "./types";

/**
 * Task endpoints, scoped to one board. The backend verifies the whole
 * workspace → project → board → task chain on every call. Listing returns
 * non-archived tasks ordered by column, then position.
 */
export const tasksApi = {
  list: (workspaceId: string, projectId: string, boardId: string) =>
    apiFetch<Task[]>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks`,
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
