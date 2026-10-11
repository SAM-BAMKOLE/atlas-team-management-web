import { apiFetch } from "./client";
import type {
  Board,
  Column,
  CreateBoardInput,
  CreateColumnInput,
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "./types";

/**
 * Project, board, and column endpoints. Every route requires workspace
 * membership; updating a project (PATCH) is restricted to owners and admins
 * by the backend.
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
};
