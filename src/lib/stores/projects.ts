import { create } from "zustand";
import { errorMessage } from "@/lib/api/errors";
import type {
  Board,
  Column,
  CreateBoardInput,
  CreateColumnInput,
  CreateProjectInput,
  Project,
  UpdateBoardInput,
  UpdateColumnInput,
} from "@/lib/api/types";
import { projectsApi } from "@/lib/api/projects";

export type ProjectsStatus = "idle" | "loading" | "ready" | "error";

interface ProjectsState {
  /** Projects of the open workspace (boards included, columns not). */
  projects: Project[];
  status: ProjectsStatus;
  error: string | null;
  /** Project open on the detail page, with each board's columns. */
  active: Project | null;
  activeStatus: ProjectsStatus;
  activeError: string | null;
  loadList: (workspaceId: string) => Promise<void>;
  loadActive: (workspaceId: string, projectId: string) => Promise<void>;
  create: (workspaceId: string, input: CreateProjectInput) => Promise<Project>;
  createBoard: (
    workspaceId: string,
    projectId: string,
    input: CreateBoardInput,
  ) => Promise<Board>;
  createColumn: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    input: CreateColumnInput,
  ) => Promise<Column>;
  updateBoard: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    input: UpdateBoardInput,
  ) => Promise<Board>;
  deleteBoard: (
    workspaceId: string,
    projectId: string,
    boardId: string,
  ) => Promise<void>;
  updateColumn: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    columnId: string,
    input: UpdateColumnInput,
  ) => Promise<Column>;
  deleteColumn: (
    workspaceId: string,
    projectId: string,
    boardId: string,
    columnId: string,
    force?: boolean,
  ) => Promise<void>;
}

let listFlight: { id: string; promise: Promise<void> } | null = null;
let activeFlight: { id: string; promise: Promise<void> } | null = null;

/** Patch one project in the list without touching the others. */
function patchListProject(
  projects: Project[],
  projectId: string,
  fn: (project: Project) => Project,
): Project[] {
  return projects.map((p) => (p.id === projectId ? fn(p) : p));
}

/** Patch one board (columns preserved) in the open project detail. */
function patchActiveBoard(
  active: Project | null,
  projectId: string,
  boardId: string,
  fn: (board: Board) => Board,
): Project | null {
  if (!active || active.id !== projectId) return active;
  return {
    ...active,
    boards: active.boards.map((b) => (b.id === boardId ? fn(b) : b)),
  };
}

/**
 * Mirror the backend's column mutation locally. A rename replaces the record
 * in place; a reorder re-inserts it at its new index and renumbers the board
 * so positions stay contiguous (the backend does the same in a transaction).
 */
function mergeColumn(
  columns: Column[],
  updated: Column,
  reordered: boolean,
): Column[] {
  const sorted = [...columns].sort((a, b) => a.position - b.position);
  if (!reordered) {
    return sorted.map((c) => (c.id === updated.id ? { ...c, ...updated } : c));
  }
  const others = sorted.filter((c) => c.id !== updated.id);
  const target = Math.min(Math.max(updated.position, 0), others.length);
  return [...others.slice(0, target), updated, ...others.slice(target)].map(
    (c, index) => ({ ...c, position: index }),
  );
}

/** Drop a column and renumber the survivors, matching the backend. */
function removeColumn(columns: Column[], columnId: string): Column[] {
  return [...columns]
    .sort((a, b) => a.position - b.position)
    .filter((c) => c.id !== columnId)
    .map((c, index) => ({ ...c, position: index }));
}

/**
 * Project list for the open workspace plus the detail opened on the project
 * page. Loads are single-flight per id and drop stale data first, mirroring
 * the workspace store; mutations patch both the list and the active detail
 * so navigating back shows fresh boards and columns without a refetch.
 */
export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  status: "idle",
  error: null,
  active: null,
  activeStatus: "idle",
  activeError: null,

  loadList: async (workspaceId) => {
    if (listFlight?.id === workspaceId) return listFlight.promise;
    set({ projects: [], status: "loading", error: null });
    const promise = projectsApi
      .list(workspaceId)
      .then((projects) => {
        if (listFlight?.id === workspaceId) {
          set({ projects, status: "ready", error: null });
        }
      })
      .catch((error) => {
        if (listFlight?.id === workspaceId) {
          set({ status: "error", error: errorMessage(error) });
        }
      })
      .finally(() => {
        if (listFlight?.id === workspaceId) listFlight = null;
      });
    listFlight = { id: workspaceId, promise };
    return promise;
  },

  loadActive: async (workspaceId, projectId) => {
    const key = `${workspaceId}:${projectId}`;
    if (activeFlight?.id === key) return activeFlight.promise;
    set({ active: null, activeStatus: "loading", activeError: null });
    const promise = projectsApi
      .detail(workspaceId, projectId)
      .then((active) => {
        if (activeFlight?.id === key) {
          set({ active, activeStatus: "ready", activeError: null });
        }
      })
      .catch((error) => {
        if (activeFlight?.id === key) {
          set({ activeStatus: "error", activeError: errorMessage(error) });
        }
      })
      .finally(() => {
        if (activeFlight?.id === key) activeFlight = null;
      });
    activeFlight = { id: key, promise };
    return promise;
  },

  create: async (workspaceId, input) => {
    const project = await projectsApi.create(workspaceId, input);
    // The create response carries no boards array; normalize for the list.
    set({ projects: [...get().projects, { ...project, boards: [] }] });
    return project;
  },

  createBoard: async (workspaceId, projectId, input) => {
    const board = await projectsApi.createBoard(workspaceId, projectId, input);
    set({
      projects: patchListProject(get().projects, projectId, (p) => ({
        ...p,
        boards: [...p.boards, board],
      })),
      active:
        get().active?.id === projectId
          ? { ...get().active!, boards: [...get().active!.boards, board] }
          : get().active,
    });
    return board;
  },

  createColumn: async (workspaceId, projectId, boardId, input) => {
    const column = await projectsApi.createColumn(
      workspaceId,
      projectId,
      boardId,
      input,
    );
    const active = get().active;
    set({
      active:
        active?.id === projectId
          ? {
              ...active,
              boards: active.boards.map((b) =>
                b.id === boardId
                  ? { ...b, columns: [...(b.columns ?? []), column] }
                  : b,
              ),
            }
          : active,
    });
    return column;
  },

  updateBoard: async (workspaceId, projectId, boardId, input) => {
    const board = await projectsApi.updateBoard(
      workspaceId,
      projectId,
      boardId,
      input,
    );
    set({
      projects: patchListProject(get().projects, projectId, (p) => ({
        ...p,
        boards: p.boards.map((b) => (b.id === boardId ? { ...b, ...board } : b)),
      })),
      active: patchActiveBoard(get().active, projectId, boardId, (b) => ({
        ...b,
        ...board,
      })),
    });
    return board;
  },

  deleteBoard: async (workspaceId, projectId, boardId) => {
    await projectsApi.deleteBoard(workspaceId, projectId, boardId);
    const active = get().active;
    set({
      projects: patchListProject(get().projects, projectId, (p) => ({
        ...p,
        boards: p.boards.filter((b) => b.id !== boardId),
      })),
      active:
        active?.id === projectId
          ? { ...active, boards: active.boards.filter((b) => b.id !== boardId) }
          : active,
    });
  },

  updateColumn: async (workspaceId, projectId, boardId, columnId, input) => {
    const column = await projectsApi.updateColumn(
      workspaceId,
      projectId,
      boardId,
      columnId,
      input,
    );
    const reordered = input.position !== undefined;
    set({
      active: patchActiveBoard(get().active, projectId, boardId, (b) => ({
        ...b,
        columns: mergeColumn(b.columns ?? [], column, reordered),
      })),
    });
    return column;
  },

  deleteColumn: async (workspaceId, projectId, boardId, columnId, force) => {
    await projectsApi.deleteColumn(
      workspaceId,
      projectId,
      boardId,
      columnId,
      force,
    );
    set({
      active: patchActiveBoard(get().active, projectId, boardId, (b) => ({
        ...b,
        columns: removeColumn(b.columns ?? [], columnId),
      })),
    });
  },
}));
