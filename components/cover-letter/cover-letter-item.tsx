"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  updateCoverLetterSchema,
  type CoverLetterListItem,
} from "@/types/cover-letter";

export function CoverLetterItem({
  coverLetter,
}: {
  coverLetter: CoverLetterListItem;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(coverLetter.title);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = updateCoverLetterSchema.safeParse({ title });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/cover-letters/${coverLetter.id}`, {
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

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/cover-letters/${coverLetter.id}`, {
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

  const isBusy = isSaving || isDeleting;

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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-label="Cover letter title"
                autoFocus
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
                  setTitle(coverLetter.title);
                  setIsEditing(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <Link
              href={`/dashboard/cover-letters/${coverLetter.id}`}
              className="group flex items-start gap-3"
            >
              <div className="from-chart-violet/20 to-chart-violet/5 text-chart-violet ring-chart-violet/15 flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset transition-transform duration-300 group-hover:scale-105">
                <MailIcon className="size-4.5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-foreground font-medium group-hover:underline">
                  {coverLetter.title}
                </span>
                <span className="text-muted-foreground text-xs">
                  Updated {new Date(coverLetter.updatedAt).toLocaleString()}
                </span>
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
              <Link href={`/dashboard/cover-letters/${coverLetter.id}`}>
                Edit
              </Link>
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
              title={`Delete "${coverLetter.title}"?`}
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
