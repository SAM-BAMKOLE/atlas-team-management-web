import type { Metadata } from "next";
import { ProjectDetailPanel } from "@/components/project/project-detail-panel";

export const metadata: Metadata = { title: "Project" };

/**
 * One project's boards and columns. The workspace id comes from the shared
 * store inside the panel; the project id is this segment's param.
 */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectDetailPanel projectId={projectId} />;
}
