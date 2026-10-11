import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents was enabled by the Next 16 scaffold, but its build-time
  // prerender of the [workspaceId] segment aborts nondeterministically
  // ("client rendering requested outside a Suspense boundary") because the
  // shell's useParams can't resolve unknown ids at build time. The app uses
  // none of the cacheComponents APIs, so it runs without it.
};

export default nextConfig;
