import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SECTION_TYPE_LABELS } from "@/types/resume-section";
import type { AtsReport } from "@/types/ai";

type Props = {
  report: AtsReport;
};

const SCORE_ROWS: { key: keyof AtsReport; label: string }[] = [
  { key: "overallScore", label: "Overall" },
  { key: "keywordScore", label: "Keywords" },
  { key: "skillsScore", label: "Skills" },
  { key: "readabilityScore", label: "Readability" },
  { key: "jobMatchScore", label: "Job match" },
];

function scoreColor(score: number) {
  if (score >= 80) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-destructive";
}

export function AtsReportContent({ report }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {SCORE_ROWS.filter(
          (row) => row.key !== "jobMatchScore" || report.jobMatchScore !== null,
        ).map((row) => {
          const score = (report[row.key] as number | null) ?? 0;
          return (
            <div key={row.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">{row.label}</span>
                <span className="text-muted-foreground">{score}/100</span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full ${scoreColor(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {report.missingSections.length > 0 && (
        <Card className="gap-2 p-4">
          <h2 className="text-foreground font-semibold">Missing sections</h2>
          <ul className="flex flex-wrap gap-2">
            {report.missingSections.map((type) => (
              <li key={type}>
                <Badge variant="warning">{SECTION_TYPE_LABELS[type]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {report.missingKeywords.length > 0 && (
        <Card className="gap-2 p-4">
          <h2 className="text-foreground font-semibold">Missing keywords</h2>
          <ul className="flex flex-wrap gap-2">
            {report.missingKeywords.map((keyword) => (
              <li key={keyword}>
                <Badge variant="warning">{keyword}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {report.suggestions.length > 0 && (
        <Card className="gap-2 p-4">
          <h2 className="text-foreground font-semibold">Suggestions</h2>
          <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm">
            {report.suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
