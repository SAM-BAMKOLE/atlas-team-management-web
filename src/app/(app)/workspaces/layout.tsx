import type { Metadata } from "next";

/**
 * The workspaces list is a client page (it fetches memberships client-side),
 * so it can't export metadata itself — this passthrough layout supplies its
 * title. Nested workspace routes override it with their own titles.
 */
export const metadata: Metadata = { title: "Workspaces" };

export default function WorkspacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
