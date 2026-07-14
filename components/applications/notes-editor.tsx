"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function NotesEditor({
  applicationId,
  notes,
}: {
  applicationId: string;
  notes: string | null;
}) {
  const router = useRouter();

  const [value, setValue] = useState(notes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: value }),
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
    <div className="flex flex-col gap-2">
      <Textarea
        rows={8}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Interview tips, recruiter info, questions to ask, salary expectations, company research..."
      />
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button onClick={handleSave} disabled={isSaving} className="self-start">
        {isSaving ? "Saving..." : "Save notes"}
      </Button>
    </div>
  );
}
