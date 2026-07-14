import {
  BriefcaseIcon,
  CalendarClockIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  XCircleIcon,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import type { JobApplicationsDashboardData } from "@/types/job-application";

export function ApplicationsOverviewCard({
  overview,
}: {
  overview: JobApplicationsDashboardData["overview"];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        label="Total Applications"
        value={overview.totalApplications}
        icon={ClipboardListIcon}
        tone="blue"
      />
      <StatCard
        label="Active"
        value={overview.activeApplications}
        icon={BriefcaseIcon}
        tone="violet"
      />
      <StatCard
        label="Interviews Scheduled"
        value={overview.interviewsScheduled}
        icon={CalendarClockIcon}
        tone="amber"
      />
      <StatCard
        label="Offers Received"
        value={overview.offersReceived}
        icon={CheckCircleIcon}
        tone="teal"
      />
      <StatCard
        label="Rejections"
        value={overview.rejections}
        icon={XCircleIcon}
        tone="rose"
      />
    </div>
  );
}
