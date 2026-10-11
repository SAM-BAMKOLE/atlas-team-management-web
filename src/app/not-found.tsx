import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "cn";

/** Branded 404 for any unmatched URL (entity pages render their own cards). */
export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          A
        </span>
        <span className="text-lg font-semibold">Atlas</span>
      </Link>
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Page not found</CardTitle>
            <CardDescription>
              The page you’re looking for doesn’t exist or may have been moved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/workspaces"
              className={cn(
                buttonVariants({ variant: "outline", className: "w-full" }),
              )}
            >
              Back to workspaces
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
