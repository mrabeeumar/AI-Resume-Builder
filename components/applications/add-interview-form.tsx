"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INTERVIEW_TYPES, MEETING_PLATFORMS } from "@/lib/enums";
import { createJobInterviewSchema } from "@/types/job-interview";

const EMPTY = {
  interviewType: INTERVIEW_TYPES[0],
  scheduledDate: "",
  scheduledTime: "",
  timezone: "",
  meetingPlatform: "",
  meetingLink: "",
  interviewerName: "",
  interviewerEmail: "",
};

export function AddInterviewForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();

  const [fields, setFields] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof typeof EMPTY) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = createJobInterviewSchema.safeParse({
      interviewType: fields.interviewType,
      scheduledDate: fields.scheduledDate || undefined,
      scheduledTime: fields.scheduledTime || undefined,
      timezone: fields.timezone || undefined,
      meetingPlatform: fields.meetingPlatform || undefined,
      meetingLink: fields.meetingLink || undefined,
      interviewerName: fields.interviewerName || undefined,
      interviewerEmail: fields.interviewerEmail || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/applications/${applicationId}/interviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setFields(EMPTY);
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
          <Label htmlFor="interview-type">Interview type</Label>
          <select
            id="interview-type"
            value={fields.interviewType}
            onChange={update("interviewType")}
            className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm shadow-xs"
          >
            {INTERVIEW_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="interview-platform">Meeting platform</Label>
          <select
            id="interview-platform"
            value={fields.meetingPlatform}
            onChange={update("meetingPlatform")}
            className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm shadow-xs"
          >
            <option value="">Not specified</option>
            {MEETING_PLATFORMS.map((value) => (
              <option key={value} value={value}>
                {value.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="interview-date">Date</Label>
          <Input
            id="interview-date"
            type="date"
            value={fields.scheduledDate}
            onChange={update("scheduledDate")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="interview-time">Time</Label>
          <Input
            id="interview-time"
            type="time"
            value={fields.scheduledTime}
            onChange={update("scheduledTime")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="interview-timezone">Timezone</Label>
          <Input
            id="interview-timezone"
            placeholder="e.g. America/New_York"
            value={fields.timezone}
            onChange={update("timezone")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="interview-link">Meeting link</Label>
          <Input
            id="interview-link"
            type="url"
            value={fields.meetingLink}
            onChange={update("meetingLink")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="interviewer-name">Interviewer name</Label>
          <Input
            id="interviewer-name"
            value={fields.interviewerName}
            onChange={update("interviewerName")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="interviewer-email">Interviewer email</Label>
          <Input
            id="interviewer-email"
            type="email"
            value={fields.interviewerEmail}
            onChange={update("interviewerEmail")}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Adding..." : "Add interview round"}
      </Button>
    </form>
  );
}
