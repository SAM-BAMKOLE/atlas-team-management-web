import { Crown, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WorkspaceRole } from "@/lib/api/types";
import { cn } from "cn";

export const ROLE_BADGE: Record<
  WorkspaceRole,
  { label: string; icon: typeof Crown; className: string }
> = {
  OWNER: { label: "Owner", icon: Crown, className: "bg-amber-500/15 text-amber-600" },
  ADMIN: { label: "Admin", icon: Shield, className: "bg-blue-500/15 text-blue-600" },
  MEMBER: { label: "Member", icon: User, className: "bg-muted text-muted-foreground" },
};

/** Roles assignable through the UI (ownership transfer is not supported). */
export const EDITABLE_ROLES: WorkspaceRole[] = ["ADMIN", "MEMBER"];

export function RoleBadge({ role }: { role: WorkspaceRole }) {
  const { label, icon: Icon, className } = ROLE_BADGE[role];
  return (
    <Badge variant="secondary" className={cn("gap-1", className)}>
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}
