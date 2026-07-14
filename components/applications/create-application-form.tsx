"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EMPLOYMENT_TYPES, WORK_MODES } from "@/lib/enums";
import { createJobApplicationSchema } from "@/types/job-application";

const EMPTY = {
  company: "",
  position: "",
  location: "",
  salary: "",
  employmentType: "",
  workMode: "",
  originalJobUrl: "",
  content: "",
  notes: "",
};

export function CreateApplicationForm() {
  const router = useRouter();

  const [fields, setFields] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof typeof EMPTY) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = createJobApplicationSchema.safeParse({
      company: fields.company,
      position: fields.position,
      location: fields.location || undefined,
      salary: fields.salary || undefined,
      employmentType: fields.employmentType || undefined,
      workMode: fields.workMode || undefined,
      originalJobUrl: fields.originalJobUrl || undefined,
      content: fields.content || undefined,
      notes: fields.notes || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setFields(EMPTY);
      router.push(`/dashboard/applications/${data.application.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="app-company">Company</Label>
          <Input
            id="app-company"
            value={fields.company}
            onChange={update("company")}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="app-position">Position</Label>
          <Input
            id="app-position"
            value={fields.position}
            onChange={update("position")}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="app-location">Location</Label>
          <Input id="app-location" value={fields.location} onChange={update("location")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="app-salary">Salary</Label>
          <Input id="app-salary" value={fields.salary} onChange={update("salary")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="app-employment-type">Employment type</Label>
          <select
            id="app-employment-type"
            value={fields.employmentType}
            onChange={update("employmentType")}
            className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm shadow-xs"
          >
            <option value="">Not specified</option>
            {EMPLOYMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {value.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="app-work-mode">Work mode</Label>
          <select
            id="app-work-mode"
            value={fields.workMode}
            onChange={update("workMode")}
            className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm shadow-xs"
          >
            <option value="">Not specified</option>
            {WORK_MODES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="app-url">Job URL</Label>
          <Input id="app-url" type="url" value={fields.originalJobUrl} onChange={update("originalJobUrl")} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="app-content">Job description</Label>
          <Textarea id="app-content" rows={4} value={fields.content} onChange={update("content")} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="app-notes">Personal notes</Label>
          <Textarea id="app-notes" rows={3} value={fields.notes} onChange={update("notes")} />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Creating..." : "Create application"}
      </Button>
    </form>
  );
}
