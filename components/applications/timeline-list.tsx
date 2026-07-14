import { CircleIcon } from "lucide-react";

import type { ApplicationTimelineItem } from "@/types/job-application";

const EVENT_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  RESUME_VIEWED: "Resume Viewed",
  ASSESSMENT_SENT: "Assessment Sent",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  INTERVIEW_COMPLETED: "Interview Completed",
  OFFER_RECEIVED: "Offer Received",
  STATUS_UPDATED: "Status Updated",
  NOTE_ADDED: "Notes Added",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export function TimelineList({ events }: { events: ApplicationTimelineItem[] }) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No timeline events yet.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3">
          <CircleIcon className="text-primary mt-1 size-2.5 shrink-0 fill-current" />
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground text-sm font-medium">
              {EVENT_LABELS[event.event] ?? event.event}
            </span>
            <span className="text-muted-foreground text-xs">
              {new Date(event.timestamp).toLocaleString()}
            </span>
            {event.notes && (
              <span className="text-muted-foreground text-sm">{event.notes}</span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
