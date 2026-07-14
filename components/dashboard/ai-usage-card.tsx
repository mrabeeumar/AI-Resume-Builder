import { SparklesIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FEATURE_LABELS: Record<string, string> = {
  RESUME_GENERATION: "Resume generation",
  RESUME_REWRITE: "Resume rewrite",
  BULLET_IMPROVEMENT: "Bullet improvement",
  ATS_ANALYSIS: "ATS analysis",
  COVER_LETTER_GENERATION: "Cover letter generation",
  COVER_LETTER_REWRITE: "Cover letter rewrite",
  COVER_LETTER_CUSTOMIZE: "Cover letter customization",
  KEYWORD_EXTRACTION: "Keyword extraction",
};

const DOT_TONES = [
  "bg-chart-blue",
  "bg-chart-violet",
  "bg-chart-teal",
  "bg-chart-amber",
  "bg-chart-rose",
];

interface AIUsageCardProps {
  totalCalls: number;
  totalTokens: number;
  windowDays: number;
  byFeature: { feature: string; calls: number; tokens: number }[];
}

function AIUsageCard({
  totalCalls,
  totalTokens,
  windowDays,
  byFeature,
}: AIUsageCardProps) {
  return (
    <Card className="hover-glow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="from-chart-amber/20 to-chart-amber/5 text-chart-amber ring-chart-amber/15 flex size-9 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset">
            <SparklesIcon className="size-4.5" />
          </div>
          <CardTitle className="text-lg">AI usage</CardTitle>
        </div>
        <p className="text-muted-foreground text-sm">
          Last {windowDays} days &middot; {totalCalls} calls &middot;{" "}
          {totalTokens.toLocaleString()} tokens
        </p>
      </CardHeader>
      <CardContent>
        {byFeature.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No AI usage yet. Generate a resume or cover letter to see stats
            here.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {byFeature.map((row, i) => (
              <li
                key={row.feature}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <span className="text-foreground flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      DOT_TONES[i % DOT_TONES.length],
                    )}
                  />
                  {FEATURE_LABELS[row.feature] ?? row.feature}
                </span>
                <span className="text-muted-foreground text-xs">
                  {row.calls} calls &middot; {row.tokens.toLocaleString()}{" "}
                  tokens
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { AIUsageCard };
