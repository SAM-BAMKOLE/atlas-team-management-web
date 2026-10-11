import { apiFetch } from "./client";
import type { CreateLabelInput, Label } from "./types";

/**
 * Workspace-scoped labels. The backend exposes only create and list — there
 * are no update or delete endpoints — so this mirrors that surface. Label
 * names are unique within a workspace.
 */
export const labelsApi = {
  list: (workspaceId: string) =>
    apiFetch<Label[]>(`/workspaces/${workspaceId}/labels`),

  create: (workspaceId: string, input: CreateLabelInput) =>
    apiFetch<Label>(`/workspaces/${workspaceId}/labels`, {
      method: "POST",
      body: input,
    }),
};
