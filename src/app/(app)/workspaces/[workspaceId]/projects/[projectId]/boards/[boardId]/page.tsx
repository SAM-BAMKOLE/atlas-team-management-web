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
  return <BoardPanel projectId={projectId} boardId={boardId} />;
}
