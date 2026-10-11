"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/errors";
import { useAuthStore } from "@/lib/stores/auth";
import { MessageCard } from "./message-card";
import { resetPasswordSchema, type ResetPasswordValues } from "./schemas";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const signOut = useAuthStore((s) => s.signOut);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: ResetPasswordValues) {
    if (!token) return;
    setApiError(null);
    try {
      await authApi.confirmPasswordReset({
        token,
        password: values.password,
      });
      // The backend revokes every session on reset — drop this one too so the
      // success screen's "Sign in" leads to the form, not a stale session.
      await signOut();
      setDone(true);
    } catch (error) {
      setApiError(errorMessage(error));
    }
  }

  if (!token) {
    return (
      <MessageCard
        title="Invalid reset link"
        description="This password reset link is missing or malformed. Request a new one."
      >
        <Button variant="outline" asChild>
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </MessageCard>
    );
  }

  if (done) {
    return (
      <MessageCard
        title="Password updated"
        description="Your password has been changed and all sessions were signed out."
      >
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </MessageCard>
    );
  }

  return (
    <Card>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>
            Your previous sessions will be signed out after the change.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {apiError ? (
            <p role="alert" className="text-sm text-destructive">
              {apiError}
            </p>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="reset-password">New password</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              aria-invalid={errors.password ? true : undefined}
              {...form.register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reset-confirm">Confirm new password</Label>
            <Input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.confirmPassword ? true : undefined}
              {...form.register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            Update password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
