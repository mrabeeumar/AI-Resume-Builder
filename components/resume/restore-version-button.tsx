"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Props = {
  resumeId: string;
  versionId: string;
  versionLabel: string;
};

export function RestoreVersionButton({
  resumeId,
  versionId,
  versionLabel,
}: Props) {
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRestore = async () => {
    setError(null);
    setIsRestoring(true);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/versions/${versionId}/restore`,
        { method: "POST" },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(`/dashboard/resumes/${resumeId}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <ConfirmDialog
        trigger={
          <Button type="button" variant="outline" size="sm" disabled={isRestoring}>
            {isRestoring ? "Restoring..." : "Restore this version"}
          </Button>
        }
        title={`Restore "${versionLabel}"?`}
        description="Your current content will be saved as a new version first."
        confirmLabel="Restore"
        onConfirm={handleRestore}
      />
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
