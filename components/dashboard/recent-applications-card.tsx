import Link from "next/link";
import { BriefcaseIcon } from "lucide-react";

import { StatusBadge } from "@/components/applications/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobApplicationsDashboardData } from "@/types/job-application";

export function RecentApplicationsCard({
  applications,
}: {
  applications: JobApplicationsDashboardData["recentApplications"];
}) {
  return (
    <Card className="gap-4 py-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BriefcaseIcon className="size-4" />
          Recent applications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No applications yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {applications.map((application) => (
              <li key={application.id}>
                <Link
                  href={`/dashboard/applications/${application.id}`}
                  className="hover:bg-accent flex items-center justify-between gap-3 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">
                      {application.position}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {application.company}
                    </span>
                  </div>
                  <StatusBadge status={application.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
