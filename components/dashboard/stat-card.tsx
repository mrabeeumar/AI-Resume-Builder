import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  blue: "from-chart-blue/20 to-chart-blue/5 text-chart-blue ring-chart-blue/15",
  violet:
    "from-chart-violet/20 to-chart-violet/5 text-chart-violet ring-chart-violet/15",
  teal: "from-chart-teal/20 to-chart-teal/5 text-chart-teal ring-chart-teal/15",
  amber:
    "from-chart-amber/20 to-chart-amber/5 text-chart-amber ring-chart-amber/15",
  rose: "from-chart-rose/20 to-chart-rose/5 text-chart-rose ring-chart-rose/15",
} as const;

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  tone?: keyof typeof TONE_CLASSES;
  className?: string;
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "blue",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("hover-glow group gap-3 py-6", className)}>
      <div className="flex items-start justify-between px-6">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-sm font-medium">
            {label}
          </span>
          <span className="font-heading text-foreground text-3xl font-bold tracking-tight">
            {value}
          </span>
          {description ? (
            <span className="text-muted-foreground text-xs">
              {description}
            </span>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6",
              TONE_CLASSES[tone],
            )}
          >
            <Icon className="size-5" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export { StatCard };
