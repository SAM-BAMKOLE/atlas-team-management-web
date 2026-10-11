import { redirect } from "next/navigation";

/**
 * Workspace sections live at their own routes; the workspace list and the
 * invitation-accept flow land here and are forwarded to the projects section.
 */
export default async function WorkspaceIndexPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  redirect(`/workspaces/${workspaceId}/projects`);
}
