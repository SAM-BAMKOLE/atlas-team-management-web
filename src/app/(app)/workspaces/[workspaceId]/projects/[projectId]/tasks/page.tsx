import type { Metadata } from "next";
import { ProjectTasksPanel } from "@/components/task/project-tasks-panel";

export const metadata: Metadata = { title: "Tasks" };

/** Every task across the project's boards, with active/archived tabs. */
export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectTasksPanel projectId={projectId} />;
}