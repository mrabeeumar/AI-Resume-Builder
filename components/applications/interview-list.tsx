import { InterviewItem } from "@/components/applications/interview-item";
import type { JobInterviewItem } from "@/types/job-interview";

export function InterviewList({
  interviews,
  resumeId,
}: {
  interviews: JobInterviewItem[];
  resumeId: string | null;
}) {
  if (interviews.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No interview rounds yet. Add one below to start tracking.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {interviews.map((interview) => (
        <InterviewItem key={interview.id} interview={interview} resumeId={resumeId} />
      ))}
    </div>
  );
}
