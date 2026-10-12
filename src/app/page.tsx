import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Track every project as a team",
  description:
    "Atlas organizes your workspace into projects and kanban boards, so every task, deadline, and teammate lands exactly where it belongs.",
};

export default function Home() {
  return <LandingPage />;
}