import type { Metadata } from "next";
import { ProjectsPanel } from "@/components/project/projects-panel";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return <ProjectsPanel />;
}
