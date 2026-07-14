"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarIcon, LinkIcon, SparklesIcon, UserIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { JOB_INTERVIEW_STATUSES, type JobInterviewStatus } from "@/lib/enums";
import type { JobInterviewItem } from "@/types/job-interview";

const STATUS_VARIANT: Record<
  JobInterviewStatus,
  "outline" | "warning" | "success" | "destructive" | "info"
> = {
  PENDING: "outline",
  SCHEDULED: "info",
  COMPLETED: "success",
  CANCELED: "destructive",
  RESCHEDULED: "warning",
};

export function InterviewItem({
  interview,
  resumeId,
}: {
  interview: JobInterviewItem;
  resumeId: string | null;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setError(null);
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: e.target.value }),
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
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/interviews/${interview.id}`, {
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

  return (
    <Card className="gap-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-foreground font-heading font-semibold">
            Round {interview.roundNumber} &middot; {interview.interviewType}
          </span>
          {interview.scheduledDate && (
            <span className="text-muted-foreground flex items-center gap-1 text-sm">
              <CalendarIcon className="size-3.5" />
              {new Date(interview.scheduledDate).toLocaleDateString()}
              {interview.scheduledTime ? ` at ${interview.scheduledTime}` : ""}
              {interview.timezone ? ` (${interview.timezone})` : ""}
            </span>
          )}
          {interview.interviewerName && (
            <span className="text-muted-foreground flex items-center gap-1 text-sm">
              <UserIcon className="size-3.5" />
              {interview.interviewerName}
            </span>
          )}
          {interview.meetingLink && (
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="text-primary flex items-center gap-1 text-sm underline"
            >
              <LinkIcon className="size-3.5" />
              Join meeting
            </a>
          )}
          {interview.notes && (
            <p className="text-muted-foreground text-sm">{interview.notes}</p>
          )}
        </div>
        <Badge variant={STATUS_VARIANT[interview.status]}>{interview.status}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={interview.status}
          onChange={handleStatusChange}
          disabled={isUpdating}
          className="border-input bg-background text-foreground h-8 rounded-md border px-2 text-xs shadow-xs"
        >
          {JOB_INTERVIEW_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        {resumeId && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/resumes/${resumeId}/interview`}>
              <SparklesIcon className="size-3.5" />
              Practice interview
            </Link>
          </Button>
        )}
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm" disabled={isDeleting}>
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
          }
          title="Remove this interview round?"
          description="This cannot be undone."
          confirmLabel="Remove"
          onConfirm={handleDelete}
        />
      </div>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </Card>
  );
}
