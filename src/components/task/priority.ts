import type { TaskPriority } from "@/lib/api/types";

/** Tailwind class per priority for the small dot shown on task cards. */
export const PRIORITY_DOT: Record<TaskPriority, string> = {
  LOW: "bg-sky-500",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};
