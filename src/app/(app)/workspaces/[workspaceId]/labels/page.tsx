import type { Metadata } from "next";
import { LabelsPanel } from "@/components/label/labels-panel";

export const metadata: Metadata = { title: "Labels" };

export default function LabelsPage() {
  return <LabelsPanel />;
}
