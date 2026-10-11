import type { Metadata } from "next";
import { TaskDetailPanel } from "@/components/task/task-detail-panel";

export const metadata: Metadata = { title: "Task" };

/** Task detail for one board task; ids come from this segment's params. */
export default async function TaskPage({
  params,
}: {
  params: Promise<{ projectId: string; boardId: string; taskId: string }>;
}) {
  const { projectId, boardId, taskId } = await params;
  return (
    <TaskDetailPanel projectId={projectId} boardId={boardId} taskId={taskId} />
  );
}
