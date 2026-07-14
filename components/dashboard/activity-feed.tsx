import { ActivityIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardActivityItem } from "@/services/dashboard.service";

const ACTIVITY_LABELS: Record<DashboardActivityItem["type"], string> = {
  RESUME_CREATED: "created resume",
  RESUME_UPDATED: "updated resume",
  COVER_LETTER_CREATED: "created cover letter",
  COVER_LETTER_UPDATED: "updated cover letter",
};

const ACTIVITY_DOT: Record<DashboardActivityItem["type"], string> = {
  RESUME_CREATED: "bg-chart-blue",
  RESUME_UPDATED: "bg-chart-blue/50",
  COVER_LETTER_CREATED: "bg-chart-violet",
  COVER_LETTER_UPDATED: "bg-chart-violet/50",
};

interface ActivityFeedProps {
  items: DashboardActivityItem[];
}

function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card className="hover-glow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="from-chart-teal/20 to-chart-teal/5 text-chart-teal ring-chart-teal/15 flex size-9 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset">
            <ActivityIcon className="size-4.5" />
          </div>
          <CardTitle className="text-lg">Recent activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No activity yet. Your recent changes will show up here.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {items.map((item) => (
              <li
                key={`${item.type}-${item.id}`}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <p className="text-foreground flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      ACTIVITY_DOT[item.type],
                    )}
                  />
                  You {ACTIVITY_LABELS[item.type]}{" "}
                  <span className="font-medium">{item.title}</span>
                </p>
                <span className="text-muted-foreground shrink-0 pl-4 text-xs">
                  {item.occurredAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { ActivityFeed };
