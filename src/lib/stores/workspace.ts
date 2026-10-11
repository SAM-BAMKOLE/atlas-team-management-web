import { create } from "zustand";
import { errorMessage } from "@/lib/api/errors";
import type { WorkspaceDetail } from "@/lib/api/types";
import { workspacesApi } from "@/lib/api/workspaces";

export type WorkspaceStatus = "idle" | "loading" | "ready" | "error";

interface WorkspaceState {
  /** The workspace open in the shell — feeds the header, sidebar, and pages. */
  detail: WorkspaceDetail | null;
  status: WorkspaceStatus;
  error: string | null;
  load: (workspaceId: string) => Promise<void>;
  /** Patch the open workspace after a mutation (rename, role change, remove). */
  update: (fn: (detail: WorkspaceDetail) => WorkspaceDetail) => void;
}

let inFlight: { id: string; promise: Promise<void> } | null = null;

/**
 * Detail of the currently open workspace, shared so one mutation updates the
 * header, sidebar, and member/settings views at once. Every load starts from
 * a clean slate — stale data is dropped before the fetch so a workspace the
 * viewer can no longer access (or a different user's session) never shows.
 */
export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  detail: null,
  status: "idle",
  error: null,

  load: async (workspaceId) => {
    if (inFlight?.id === workspaceId) return inFlight.promise;
    set({ detail: null, status: "loading", error: null });
    const promise = workspacesApi
      .detail(workspaceId)
      .then((detail) => {
        if (inFlight?.id === workspaceId) {
          set({ detail, status: "ready", error: null });
        }
      })
      .catch((error) => {
        if (inFlight?.id === workspaceId) {
          set({ status: "error", error: errorMessage(error) });
        }
      })
      .finally(() => {
        if (inFlight?.id === workspaceId) inFlight = null;
      });
    inFlight = { id: workspaceId, promise };
    return promise;
  },

  update: (fn) => {
    const detail = get().detail;
    if (detail) set({ detail: fn(detail) });
  },
}));
