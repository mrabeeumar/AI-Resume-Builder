"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileTextIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { updateResumeSchema, type ResumeListItem } from "@/types/resume";

export function ResumeItem({ resume }: { resume: ResumeListItem }) {
  const router = useRouter();

  const [title, setTitle] = useState(resume.title);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) titleInputRef.current?.focus();
  }, [isEditing]);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = updateResumeSchema.safeParse({ title });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/resumes/${resume.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setIsEditing(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async () => {
    setError(null);
    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/resumes/${resume.id}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/resumes/${resume.id}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isBusy = isSaving || isDuplicating || isDeleting;

  return (
    <li>
      <Card className="hover-glow h-full gap-3 py-4">
        <div className="flex flex-col gap-3 px-4">
          {isEditing ? (
            <form
              onSubmit={handleRename}
              className="flex flex-wrap items-center gap-2"
            >
              <Input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-label="Resume title"
                required
              />
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSaving}
                onClick={() => {
                  setTitle(resume.title);
                  setIsEditing(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <Link
              href={`/dashboard/resumes/${resume.id}`}
              className="group flex items-start gap-3"
            >
              <div className="from-chart-blue/20 to-chart-blue/5 text-chart-blue ring-chart-blue/15 flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset transition-transform duration-300 group-hover:scale-105">
                <FileTextIcon className="size-4.5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-foreground font-medium group-hover:underline">
                  {resume.title}
                </span>
                <Badge variant="secondary" className="w-fit capitalize">
                  {resume.status.toLowerCase()}
                </Badge>
              </div>
            </Link>
          )}

          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
        </div>

        {!isEditing && (
          <div className="border-border flex flex-wrap items-center gap-2 border-t px-4 pt-3">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={`/dashboard/resumes/${resume.id}`}>Edit</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => setIsEditing(true)}
            >
              Rename
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={handleDuplicate}
            >
              {isDuplicating ? "Duplicating..." : "Duplicate"}
            </Button>
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isBusy}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              }
              title={`Delete "${resume.title}"?`}
              description="This cannot be undone."
              confirmLabel="Delete"
              variant="destructive"
              onConfirm={handleDelete}
            />
          </div>
        )}
      </Card>
    </li>
  );
}
