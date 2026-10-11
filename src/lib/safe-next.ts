/**
 * Validates a `?next=` redirect target: only same-site absolute paths are
 * allowed (rejects `//host` and external URLs — open-redirect guard).
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}
