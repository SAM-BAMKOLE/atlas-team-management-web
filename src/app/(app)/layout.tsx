import type { ReactNode } from "react";
import { AppGuard } from "@/components/layout/app-guard";

/** The authenticated shell reads the URL (active nav) and session state. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppGuard>{children}</AppGuard>;
}
