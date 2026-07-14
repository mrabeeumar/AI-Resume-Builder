import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import type { JobApplicationStatus } from "@/lib/enums";

const STATUS_LABELS: Record<JobApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  RESUME_VIEWED: "Resume Viewed",
  ASSESSMENT: "Assessment",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  INTERVIEW_COMPLETED: "Interview Completed",
  SECOND_INTERVIEW: "Second Interview",
  FINAL_INTERVIEW: "Final Interview",
  OFFER_RECEIVED: "Offer Received",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  ARCHIVED: "Archived",
};

const STATUS_VARIANTS: Record<
  JobApplicationStatus,
  "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info"
> = {
  SAVED: "outline",
  APPLIED: "info",
  RESUME_VIEWED: "info",
  ASSESSMENT: "warning",
  INTERVIEW_SCHEDULED: "warning",
  INTERVIEW_COMPLETED: "warning",
  SECOND_INTERVIEW: "warning",
  FINAL_INTERVIEW: "warning",
  OFFER_RECEIVED: "success",
  ACCEPTED: "success",
  REJECTED: "destructive",
  WITHDRAWN: "secondary",
  ARCHIVED: "secondary",
};

export function StatusBadge({
  status,
  children,
  ...props
}: { status: JobApplicationStatus } & Omit<ComponentProps<typeof Badge>, "variant">) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} {...props}>
      {children ?? STATUS_LABELS[status]}
    </Badge>
  );
}

export { STATUS_LABELS };
