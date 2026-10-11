import { Loader2 } from "lucide-react";

/**
 * Full-viewport spinner used by the route guards. The guards render this as an
 * overlay on top of `{children}` (instead of replacing them) so every page
 * segment stays in the render tree — required by Next.js instant-navigation
 * validation with Cache Components, and it keeps the static shell free of a
 * flash of unguarded content.
 */
export function SessionOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
