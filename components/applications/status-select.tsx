"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { STATUS_LABELS } from "@/components/applications/status-badge";
import { JOB_APPLICATION_STATUSES, type JobApplicationStatus } from "@/lib/enums";

export function StatusSelect({
  applicationId,
  status,
}: {
  applicationId: string;
  status: JobApplicationStatus;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as JobApplicationStatus;
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
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
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <select
        value={status}
        onChange={handleChange}
        disabled={isSaving}
        className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm shadow-xs"
      >
        {JOB_APPLICATION_STATUSES.map((value) => (
          <option key={value} value={value}>
            {STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
