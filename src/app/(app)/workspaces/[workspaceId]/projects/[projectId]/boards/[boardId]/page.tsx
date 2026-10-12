import type { Metadata } from "next";
import { BoardPanel } from "@/components/board/board-panel";

export const metadata: Metadata = { title: "Board" };

/** Kanban board for one project board. Ids come from this segment's params. */
export default async function BoardPage({
  params,
}: {
  params: Promise<{ projectId: string; boardId: string }>;
}) {
  const { projectId, boardId } = await params;
  // Keyed by board so archived-view state can't leak across board switches.
  return <BoardPanel key={boardId} projectId={projectId} boardId={boardId} />;
}
