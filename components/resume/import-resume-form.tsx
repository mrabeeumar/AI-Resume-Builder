"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ACCEPTED_FILE_TYPES =
  "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function ImportResumeForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a PDF or DOCX file.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resumes/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      const { resume } = await response.json();
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.push(`/dashboard/resumes/${resume.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2" noValidate>
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="resume-import-file" className="sr-only">
          Import resume file
        </Label>
        <Input
          id="resume-import-file"
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          ref={fileInputRef}
          aria-invalid={Boolean(error)}
        />
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" variant="outline" disabled={isSubmitting}>
        {isSubmitting ? "Importing..." : "Import resume"}
      </Button>
    </form>
  );
}
