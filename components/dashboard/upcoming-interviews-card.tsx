import Link from "next/link";
import { CalendarClockIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobApplicationsDashboardData } from "@/types/job-application";

export function UpcomingInterviewsCard({
  interviews,
}: {
  interviews: JobApplicationsDashboardData["upcomingInterviews"];
}) {
  return (
    <Card className="gap-4 py-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClockIcon className="size-4" />
          Upcoming interviews
        </CardTitle>
      </CardHeader>
      <CardContent>
        {interviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No interviews scheduled yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {interviews.map((interview) => (
              <li key={interview.id}>
                <Link
                  href={`/dashboard/applications/${interview.applicationId}`}
                  className="hover:bg-accent flex items-center justify-between gap-3 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">
                      {interview.position} &middot; {interview.company}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Round {interview.roundNumber} &middot; {interview.interviewType}
                    </span>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {new Date(interview.scheduledDate).toLocaleDateString()}
                    {interview.scheduledTime ? ` ${interview.scheduledTime}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
