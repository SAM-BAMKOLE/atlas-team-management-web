import { create } from "zustand";
import { errorMessage } from "@/lib/api/errors";
import type {
  CreateTaskInput,
  MoveTaskInput,
  Task,
} from "@/lib/api/types";
import { tasksApi } from "@/lib/api/tasks";

export type BoardStatus = "idle" | "loading" | "ready" | "error";

interface BoardState {
  /** Non-archived tasks of the open board, grouped into lanes by column. */
  tasks: Task[];
  status: BoardStatus;
  error: string | null;
  load: (workspaceId: string, projectId: string, boardId: string) => Promise<void>;
  create: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    input: CreateTaskInput,
  ) => Promise<Task>;
  move: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
    input: MoveTaskInput,
  ) => Promise<void>;
  /** Merge a locally computed change into one task (e.g. after assign). */
  patchTask: (taskId: string, fn: (task: Task) => Task) => void;

  /** Archived tasks of the open board, loaded on demand. */
  archived: Task[];
  archivedStatus: BoardStatus;
  archivedError: string | null;
  loadArchived: (
    workspaceId: string,
    projectId: string,
    boardId: string,
  ) => Promise<void>;
  /** Bring an archived task back onto the board. */
  restore: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
  ) => Promise<void>;
  /** Permanently delete a task (owners/admins only). */
  purge: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    taskId: string,
  ) => Promise<void>;
}

let inFlight: { id: string; promise: Promise<void> } | null = null;

/**
 * Tasks of the currently open kanban board. Loads are single-flight per
 * board; moves patch the local task (the move response omits assignees and
 * labels, so those are kept from the existing record) instead of refetching.
 */
export const useBoardStore = create<BoardState>((set, get) => ({
  tasks: [],
  status: "idle",
  error: null,
  archived: [],
  archivedStatus: "idle",
  archivedError: null,

  load: async (workspaceId, projectId, boardId) => {
    if (inFlight?.id === boardId) return inFlight.promise;
    set({ tasks: [], status: "loading", error: null });
    const promise = tasksApi
      .list(workspaceId, projectId, boardId)
      .then((tasks) => {
        if (inFlight?.id === boardId) {
          set({ tasks, status: "ready", error: null });
        }
      })
      .catch((error) => {
        if (inFlight?.id === boardId) {
          set({ status: "error", error: errorMessage(error) });
        }
      })
      .finally(() => {
        if (inFlight?.id === boardId) inFlight = null;
      });
    inFlight = { id: boardId, promise };
    return promise;
  },

  create: async (workspaceId, projectId, boardId, input) => {
    const task = await tasksApi.create(workspaceId, projectId, boardId, input);
    set({ tasks: [...get().tasks, task] });
    return task;
  },

  move: async (workspaceId, projectId, boardId, taskId, input) => {
    const moved = await tasksApi.move(
      workspaceId,
      projectId,
      boardId,
      taskId,
      input,
    );
    set({
      tasks: get().tasks.map((task) =>
        task.id === taskId ? { ...task, ...moved } : task,
      ),
    });
  },

  /** Merge a locally computed change into one task (e.g. after assign). */
  patchTask: (taskId, fn) => {
    set({
      tasks: get().tasks.map((task) =>
        task.id === taskId ? fn(task) : task,
      ),
    });
  },

  loadArchived: async (workspaceId, projectId, boardId) => {
    // Re-fetches on every call: toggling the archived view should reflect
    // restores and purge done elsewhere (e.g. from the task detail page).
    set({ archivedStatus: "loading", archivedError: null });
    try {
      const archived = await tasksApi.list(
        workspaceId,
        projectId,
        boardId,
        true,
      );
      set({ archived, archivedStatus: "ready" });
    } catch (error) {
      set({ archivedStatus: "error", archivedError: errorMessage(error) });
    }
  },

  restore: async (workspaceId, projectId, boardId, taskId) => {
    const task = await tasksApi.restore(
      workspaceId,
      projectId,
      boardId,
      taskId,
    );
    set({
      tasks: get().tasks.some((t) => t.id === task.id)
        ? get().tasks
        : [...get().tasks, task],
      archived: get().archived.filter((t) => t.id !== task.id),
    });
  },

  purge: async (workspaceId, projectId, boardId, taskId) => {
    await tasksApi.purge(workspaceId, projectId, boardId, taskId);
    set({
      tasks: get().tasks.filter((t) => t.id !== taskId),
      archived: get().archived.filter((t) => t.id !== taskId),
    });
  },
}));
