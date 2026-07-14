"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SECTION_TYPE_LABELS } from "@/types/resume-section";
import type {
  ResumeSnapshot,
  ResumeVersionItem,
  ResumeVersionListItem,
} from "@/types/resume-version";

type Props = {
  resumeId: string;
  initialVersions: ResumeVersionListItem[];
};

type CompareResult = {
  from: ResumeVersionItem;
  to: ResumeVersionItem;
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString();
}

function diffSections(from: ResumeSnapshot, to: ResumeSnapshot) {
  const types = new Set([
    ...from.sections.map((section) => section.type),
    ...to.sections.map((section) => section.type),
  ]);

  return Array.from(types).map((type) => {
    const fromSection = from.sections.find((section) => section.type === type);
    const toSection = to.sections.find((section) => section.type === type);

    let status: "added" | "removed" | "changed" | "unchanged";
    if (!fromSection) {
      status = "added";
    } else if (!toSection) {
      status = "removed";
    } else if (JSON.stringify(fromSection) === JSON.stringify(toSection)) {
      status = "unchanged";
    } else {
      status = "changed";
    }

    return { type, status };
  });
}

const STATUS_LABELS: Record<string, string> = {
  added: "Added",
  removed: "Removed",
  changed: "Changed",
  unchanged: "Unchanged",
};

const STATUS_CLASSES: Record<string, string> = {
  added: "text-success",
  removed: "text-destructive",
  changed: "text-warning",
  unchanged: "text-muted-foreground",
};

export function VersionHistory({ resumeId, initialVersions }: Props) {
  const router = useRouter();
  const [versions, setVersions] =
    useState<ResumeVersionListItem[]>(initialVersions);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [note, setNote] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparison, setComparison] = useState<CompareResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const refreshVersions = async () => {
    const response = await fetch(`/api/resumes/${resumeId}/versions`);
    const data = await response.json().catch(() => null);
    if (response.ok) {
      setVersions(data.versions as ResumeVersionListItem[]);
    }
  };

  const handleSaveVersion = async () => {
    if (!note.trim()) {
      setError("Please name this version.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      setNote("");
      setIsSaveDialogOpen(false);
      await refreshVersions();
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    setError(null);
    setRestoringId(versionId);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/versions/${versionId}/restore`,
        { method: "POST" },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      router.push(`/dashboard/resumes/${resumeId}`);
      router.refresh();
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (versionId: string) => {
    setError(null);
    setDeletingId(versionId);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/versions/${versionId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      setSelected((prev) => prev.filter((id) => id !== versionId));
      await refreshVersions();
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelected = (versionId: string) => {
    setSelected((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length === 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  const handleCompare = async () => {
    if (selected.length !== 2) return;

    setError(null);
    setIsComparing(true);
    setComparison(null);

    try {
      const [from, to] = selected;
      const response = await fetch(
        `/api/resumes/${resumeId}/versions/compare?from=${from}&to=${to}`,
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      setComparison(data as CompareResult);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Select two versions to compare, or restore a version directly.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={selected.length !== 2 || isComparing}
            onClick={handleCompare}
          >
            {isComparing ? "Comparing..." : "Compare selected"}
          </Button>
          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save version"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save version</DialogTitle>
                <DialogDescription>
                  Give this version a name so you can find it later.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <Label htmlFor="version-note">Name</Label>
                <Input
                  id="version-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Before applying to Acme Corp"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  onClick={handleSaveVersion}
                  disabled={!note.trim() || isSaving}
                >
                  Save version
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {versions.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No versions yet. Click &quot;Save version&quot; above to create one.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {versions.map((version) => (
            <li key={version.id}>
              <Card className="flex-row flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    className="mt-1"
                    checked={selected.includes(version.id)}
                    onCheckedChange={() => toggleSelected(version.id)}
                    aria-label={`Select version ${version.versionNumber}`}
                  />
                  <div>
                    <p className="text-foreground font-medium">
                      {version.note || `Version ${version.versionNumber}`}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(version.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/resumes/${resumeId}/versions/${version.id}`}>
                      View
                    </Link>
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={restoringId === version.id}
                      >
                        {restoringId === version.id
                          ? "Restoring..."
                          : "Restore"}
                      </Button>
                    }
                    title={`Restore "${version.note || `Version ${version.versionNumber}`}"?`}
                    description="Your current content will be saved as a new version first."
                    confirmLabel="Restore"
                    onConfirm={() => handleRestore(version.id)}
                  />
                  <ConfirmDialog
                    trigger={
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={
                          deletingId === version.id || versions.length <= 1
                        }
                      >
                        {deletingId === version.id ? "Deleting..." : "Delete"}
                      </Button>
                    }
                    title={`Delete "${version.note || `Version ${version.versionNumber}`}"?`}
                    description="This version will be permanently removed. This cannot be undone."
                    confirmLabel="Delete"
                    variant="destructive"
                    onConfirm={() => handleDelete(version.id)}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {comparison && (
        <Card className="gap-3 p-4">
          <h2 className="text-foreground font-semibold">
            {comparison.from.note || `Version ${comparison.from.versionNumber}`}{" "}
            vs{" "}
            {comparison.to.note || `Version ${comparison.to.versionNumber}`}
          </h2>
          <div className="flex flex-col gap-1 text-sm">
            <p>
              <span className="text-muted-foreground">Title: </span>
              {comparison.from.content.title === comparison.to.content.title ? (
                comparison.to.content.title
              ) : (
                <>
                  <span className="text-destructive line-through">
                    {comparison.from.content.title}
                  </span>{" "}
                  <span className="text-success">
                    {comparison.to.content.title}
                  </span>
                </>
              )}
            </p>
            <p>
              <span className="text-muted-foreground">Status: </span>
              {comparison.from.content.status ===
              comparison.to.content.status ? (
                comparison.to.content.status
              ) : (
                <>
                  <span className="text-destructive line-through">
                    {comparison.from.content.status}
                  </span>{" "}
                  <span className="text-success">
                    {comparison.to.content.status}
                  </span>
                </>
              )}
            </p>
          </div>
          <ul className="flex flex-col gap-1 text-sm">
            {diffSections(comparison.from.content, comparison.to.content).map(
              ({ type, status }) => (
                <li key={type} className="flex items-center gap-2">
                  <span className={STATUS_CLASSES[status]}>
                    {STATUS_LABELS[status]}
                  </span>
                  <span>{SECTION_TYPE_LABELS[type]}</span>
                </li>
              ),
            )}
          </ul>
        </Card>
      )}
    </div>
  );
}
