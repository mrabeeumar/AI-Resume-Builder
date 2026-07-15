"use client";

import { useState } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import type {
  CoverLetterVersionItem,
  CoverLetterVersionListItem,
} from "@/types/cover-letter-version";

type Props = {
  coverLetterId: string;
  initialVersions: CoverLetterVersionListItem[];
};

type CompareResult = {
  from: CoverLetterVersionItem;
  to: CoverLetterVersionItem;
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString();
}

export function CoverLetterVersionHistory({
  coverLetterId,
  initialVersions,
}: Props) {
  const router = useRouter();
  const [versions, setVersions] =
    useState<CoverLetterVersionListItem[]>(initialVersions);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [note, setNote] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [comparison, setComparison] = useState<CompareResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const refreshVersions = async () => {
    const response = await fetch(
      `/api/cover-letters/${coverLetterId}/versions`,
    );
    const data = await response.json().catch(() => null);
    if (response.ok) {
      setVersions(data.versions as CoverLetterVersionListItem[]);
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
      const response = await fetch(
        `/api/cover-letters/${coverLetterId}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: note.trim() }),
        },
      );

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
        `/api/cover-letters/${coverLetterId}/versions/${versionId}/restore`,
        { method: "POST" },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      router.push(`/dashboard/cover-letters/${coverLetterId}`);
      router.refresh();
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setRestoringId(null);
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
        `/api/cover-letters/${coverLetterId}/versions/compare?from=${from}&to=${to}`,
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
            {isComparing && <Spinner />}
            {isComparing ? "Comparing..." : "Compare selected"}
          </Button>
          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="sm" disabled={isSaving}>
                {isSaving && <Spinner />}
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
                <Label htmlFor="cl-version-note">Name</Label>
                <Input
                  id="cl-version-note"
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
          No versions yet. Click &quot;Save version&quot; above to create one, or
          use an AI tool, which snapshots automatically first.
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
                <ConfirmDialog
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={restoringId === version.id}
                    >
                      {restoringId === version.id && <Spinner />}
                      {restoringId === version.id ? "Restoring..." : "Restore"}
                    </Button>
                  }
                  title={`Restore "${version.note || `Version ${version.versionNumber}`}"?`}
                  description="Your current content will be saved as a new version first."
                  confirmLabel="Restore"
                  onConfirm={() => handleRestore(version.id)}
                />
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
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground font-medium">
                {comparison.from.note ||
                  `Version ${comparison.from.versionNumber}`}
              </span>
              <p className="whitespace-pre-wrap">
                {comparison.from.content.content}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground font-medium">
                {comparison.to.note || `Version ${comparison.to.versionNumber}`}
              </span>
              <p className="whitespace-pre-wrap">
                {comparison.to.content.content}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
