import { Loader2 } from "lucide-react";

/** Fallback while a token-gated auth page resolves its `searchParams`. */
export function TokenFallback() {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
