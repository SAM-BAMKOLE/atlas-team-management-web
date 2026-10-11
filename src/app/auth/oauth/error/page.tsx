import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "cn";

export const metadata: Metadata = { title: "Google sign-in failed" };

/**
 * Failure landing page the backend redirects to when the Google exchange
 * itself blows up (e.g. the one-time code cannot be created). Static content,
 * so no guard, client code, or searchParams are needed.
 */
export default function OAuthErrorPage() {
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
            <CardTitle>Google sign-in failed</CardTitle>
            <CardDescription>
              Something went wrong while signing you in with Google. Please try
              again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", className: "w-full" }),
              )}
            >
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
