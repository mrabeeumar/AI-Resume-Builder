import { ApplicationItem } from "@/components/applications/application-item";
import type { JobApplicationListItem } from "@/types/job-application";

export function ApplicationList({
  applications,
}: {
  applications: JobApplicationListItem[];
}) {
  if (applications.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No applications match your search yet. Import a job posting or add
        one manually to get started.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {applications.map((application) => (
        <ApplicationItem key={application.id} application={application} />
      ))}
    </ul>
  );
}
