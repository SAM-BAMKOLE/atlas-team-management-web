import { apiFetch } from "./client";
import type {
  Board,
  Column,
  CreateBoardInput,
  CreateColumnInput,
  CreateProjectInput,
  Project,
  SuccessResponse,
  UpdateBoardInput,
  UpdateColumnInput,
  UpdateProjectInput,
} from "./types";

/**
 * Project, board, and column endpoints. Every route requires workspace
 * membership. Renaming a project, board, or column is open to any member;
 * deleting a board or column is restricted to owners and admins. Deleting a
 * column that still holds tasks needs `force` (the backend answers 409 first).
 */
export const projectsApi = {
  list: (workspaceId: string) =>
    apiFetch<Project[]>(`/workspaces/${workspaceId}/projects`),

  detail: (workspaceId: string, projectId: string) =>
    apiFetch<Project>(`/workspaces/${workspaceId}/projects/${projectId}`),

  create: (workspaceId: string, input: CreateProjectInput) =>
    apiFetch<Project>(`/workspaces/${workspaceId}/projects`, {
      method: "POST",
      body: input,
    }),

  update: (workspaceId: string, projectId: string, input: UpdateProjectInput) =>
    apiFetch<Project>(
      `/workspaces/${workspaceId}/projects/${projectId}`,
      { method: "PATCH", body: input },
    ),

  createBoard: (
    workspaceId: string,
    projectId: string,
    input: CreateBoardInput,
  ) =>
    apiFetch<Board>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards`,
      { method: "POST", body: input },
    ),

  updateBoard: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    input: UpdateBoardInput,
  ) =>
    apiFetch<Board>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}`,
      { method: "PATCH", body: input },
    ),

  deleteBoard: (workspaceId: string, projectId: string, boardId: string) =>
    apiFetch<SuccessResponse>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}`,
      { method: "DELETE" },
    ),

  createColumn: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    input: CreateColumnInput,
  ) =>
    apiFetch<Column>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns`,
      { method: "POST", body: input },
    ),

  updateColumn: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    columnId: string,
    input: UpdateColumnInput,
  ) =>
    apiFetch<Column>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns/${columnId}`,
      { method: "PATCH", body: input },
    ),

  /** Deleting a non-empty column requires `force` (the backend 409s first). */
  deleteColumn: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    columnId: string,
    force = false,
  ) =>
    apiFetch<SuccessResponse>(
      `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/columns/${columnId}${
        force ? "?force=true" : ""
      }`,
      { method: "DELETE" },
    ),
};
