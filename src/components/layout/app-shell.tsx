"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutGrid,
  LogOut,
  MoreHorizontal,
  Settings,
  Tags,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/stores/auth";
import { useWorkspaceStore } from "@/lib/stores/workspace";
import type { SafeUser } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Projects", segment: "projects", icon: LayoutGrid },
  { label: "Members", segment: "members", icon: Users },
  { label: "Labels", segment: "labels", icon: Tags },
  { label: "Settings", segment: "settings", icon: Settings },
] as const;

function extractWorkspaceId(pathname: string): string | null {
  const segments = pathname.split("/");
  if (segments[1] === "workspaces" && segments[2]) {
    return segments[2];
  }
  return null;
}

function initialsFor(user: SafeUser | null): string {
  if (!user) return "?";
  const source = (user.name ?? user.email).trim();
  const words = source.split(/\s+/);
  if (words.length >= 2 && words[0] && words[1]) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const workspaceId = extractWorkspaceId(pathname);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const workspaceDetail = useWorkspaceStore((s) => s.detail);

  const activeWorkspace =
    workspaceDetail && workspaceDetail.id === workspaceId
      ? workspaceDetail
      : null;
  const switcherLabel = activeWorkspace
    ? activeWorkspace.name
    : workspaceId
      ? "This workspace"
      : "Select a workspace";
  const monogram = activeWorkspace
    ? activeWorkspace.name.slice(0, 2).toUpperCase()
    : "W";

  return (
    <div className="flex min-h-svh bg-muted/30">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-background">
        <div className="flex h-14 items-center gap-2 px-4">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            A
          </span>
          <span className="text-sm font-semibold">Atlas</span>
        </div>

        <div className="px-3 pb-2">
          {workspaceId ? (
            // Inside a workspace the switcher jumps back to the workspace list.
            <Link
              href="/workspaces"
              title="All workspaces"
              className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <span className="flex size-5 items-center justify-center rounded bg-muted text-[10px] font-semibold">
                {monogram}
              </span>
              <span className="flex-1 truncate">{switcherLabel}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex size-5 items-center justify-center rounded bg-muted text-[10px] font-semibold">
                ?
              </span>
              <span className="flex-1 truncate">Select a workspace</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
            Workspace
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive =
              workspaceId !== null &&
              pathname.startsWith(`/workspaces/${workspaceId}/${item.segment}`);
            const content = (
              <>
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </>
            );

            if (workspaceId === null) {
              return (
                <span
                  key={item.segment}
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground/50"
                >
                  {content}
                </span>
              );
            }

            return (
              <Link
                key={item.segment}
                href={`/workspaces/${workspaceId}/${item.segment}`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-muted font-medium text-foreground",
                )}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">
                    {initialsFor(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user?.name || user?.email || "Account"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
                <MoreHorizontal className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => void signOut()}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
