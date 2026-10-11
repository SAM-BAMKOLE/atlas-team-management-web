"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label as LabelPrimitive } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api/errors";
import { labelsApi } from "@/lib/api/labels";
import type { Label } from "@/lib/api/types";
import { useWorkspaceStore } from "@/lib/stores/workspace";

/** Preset swatches; the backend requires a hex color on create. */
const COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
];

/**
 * Workspace label management. The backend exposes only create and list, so
 * this page lists labels alphabetically and offers creation — there is no
 * rename or delete. Follows the list-first convention: the create form is
 * the whole card while the workspace has no labels, otherwise it toggles from
 * a "New label" button.
 */
export function LabelsPanel() {
  const workspaceId = useWorkspaceStore((s) => s.detail?.id ?? null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[7]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    setStatus("loading");
    labelsApi
      .list(workspaceId)
      .then((list) => {
        setLabels(list);
        setStatus("ready");
      })
      .catch((err) => {
        setError(errorMessage(err));
        setStatus("error");
      });
  }, [workspaceId]);

  const resetForm = useCallback(() => {
    setName("");
    setColor(COLORS[7]);
    setFormError(null);
  }, []);

  const handleCreate = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!workspaceId || !name.trim()) return;
      setSubmitting(true);
      setFormError(null);
      try {
        const label = await labelsApi.create(workspaceId, {
          name: name.trim(),
          color,
        });
        setLabels((prev) =>
          [...prev, label].sort((a, b) => a.name.localeCompare(b.name)),
        );
        resetForm();
        setCreating(false);
      } catch (err) {
        setFormError(errorMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
    [workspaceId, name, color, resetForm],
  );

  if (!workspaceId || (status === "loading" && labels.length === 0)) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (status === "error" && labels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load labels</CardTitle>
          <CardDescription>{error ?? "Something went wrong."}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const form = (
    <form onSubmit={handleCreate} className="space-y-3">
      {formError ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="space-y-2">
        <LabelPrimitive htmlFor="label-name">Name</LabelPrimitive>
        <Input
          id="label-name"
          required
          maxLength={50}
          placeholder="Bug"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <LabelPrimitive>Color</LabelPrimitive>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className={`size-7 rounded-full transition-transform ${color === c ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <Button type="submit" disabled={submitting || !name.trim()}>
        {submitting ? <Loader2 className="animate-spin" /> : "Create label"}
      </Button>
    </form>
  );

  if (labels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create your first label</CardTitle>
          <CardDescription>
            Labels categorize tasks across every board in the workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>{form}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Labels</CardTitle>
          <CardDescription>
            {labels.length === 1
              ? "1 label in this workspace."
              : `${labels.length} labels in this workspace.`}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            resetForm();
            setCreating((v) => !v);
          }}
        >
          <Plus /> New label
        </Button>
      </CardHeader>
      {creating ? (
        <CardContent className="border-t pt-6">{form}</CardContent>
      ) : null}
      <CardContent className={creating ? "space-y-2 pt-3" : "space-y-2"}>
        {labels.map((label) => (
          <div
            key={label.id}
            className="flex items-center gap-2.5 rounded-lg border p-3"
          >
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: label.color }}
            />
            <span className="truncate text-sm">{label.name}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
