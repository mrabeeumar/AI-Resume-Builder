import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SECTION_TYPE_LABELS } from "@/types/resume-section";
import type { ReviewReport } from "@/types/resume-review";

type Props = {
  report: ReviewReport;
};

const SCORE_ROWS: { key: keyof ReviewReport["scores"]; label: string }[] = [
  { key: "overall", label: "Overall" },
  { key: "ats", label: "ATS" },
  { key: "content", label: "Content" },
  { key: "readability", label: "Readability" },
  { key: "grammar", label: "Grammar" },
  { key: "experience", label: "Experience" },
];

const SECTION_STATUS_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  STRONG: "success",
  WEAK: "warning",
  MISSING: "destructive",
};

const PRIORITY_VARIANT: Record<string, "destructive" | "warning" | "secondary"> = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};

function scoreColor(score: number) {
  if (score >= 80) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-destructive";
}

function CategoryCard({
  title,
  strengths,
  weaknesses,
  suggestions,
  extra,
}: {
  title: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  extra?: ReactNode;
}) {
  if (
    strengths.length === 0 &&
    weaknesses.length === 0 &&
    suggestions.length === 0 &&
    !extra
  ) {
    return null;
  }

  return (
    <Card className="gap-3 p-4">
      <h3 className="text-foreground font-semibold">{title}</h3>
      {strengths.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-success text-xs font-medium">Strengths</p>
          <ul className="text-muted-foreground list-disc pl-5 text-sm">
            {strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {weaknesses.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-destructive text-xs font-medium">Weaknesses</p>
          <ul className="text-muted-foreground list-disc pl-5 text-sm">
            {weaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-info text-xs font-medium">Suggestions</p>
          <ul className="text-muted-foreground list-disc pl-5 text-sm">
            {suggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {extra}
    </Card>
  );
}

export function ReviewReportView({ report }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {SCORE_ROWS.map((row) => {
          const score = report.scores[row.key];
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
                <Badge variant="destructive">{SECTION_TYPE_LABELS[type]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {report.sections.length > 0 && (
        <Card className="gap-2 p-4">
          <h2 className="text-foreground font-semibold">
            Section-by-section review
          </h2>
          <ul className="flex flex-col gap-2">
            {report.sections.map((finding) => (
              <li key={finding.section} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant={SECTION_STATUS_VARIANT[finding.status]}>
                    {finding.status}
                  </Badge>
                  <span className="text-foreground text-sm font-medium">
                    {finding.section}
                  </span>
                </div>
                {finding.notes && (
                  <p className="text-muted-foreground pl-1 text-sm">
                    {finding.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <CategoryCard title="Content" {...report.content} />
        <CategoryCard title="Experience" {...report.experience} />
        <CategoryCard
          title="Skills"
          strengths={report.skills.strengths}
          weaknesses={report.skills.weaknesses}
          suggestions={report.skills.suggestions}
          extra={
            report.skills.missingSkills.length > 0 ? (
              <div className="flex flex-col gap-1">
                <p className="text-warning text-xs font-medium">
                  Missing skills
                </p>
                <ul className="flex flex-wrap gap-2">
                  {report.skills.missingSkills.map((skill) => (
                    <li key={skill}>
                      <Badge variant="warning">{skill}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : undefined
          }
        />
        <CategoryCard title="Projects" {...report.projects} />
        <CategoryCard title="Education" {...report.education} />
      </div>

      {(report.grammar.issues.length > 0 || report.grammar.tone) && (
        <Card className="gap-2 p-4">
          <h2 className="text-foreground font-semibold">Grammar &amp; tone</h2>
          {report.grammar.tone && (
            <p className="text-muted-foreground text-sm">{report.grammar.tone}</p>
          )}
          {report.grammar.issues.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm">
              {report.grammar.issues.map((issue) => (
                <li key={issue.issue} className="text-muted-foreground">
                  <span className="text-destructive">{issue.issue}</span>
                  {issue.suggestion && <> — {issue.suggestion}</>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {report.recommendations.length > 0 && (
        <Card className="gap-3 p-4">
          <h2 className="text-foreground font-semibold">
            Improvement suggestions
          </h2>
          <ul className="flex flex-col gap-3">
            {report.recommendations.map((rec) => (
              <li
                key={`${rec.priority}-${rec.problem}`}
                className="flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={PRIORITY_VARIANT[rec.priority]}>
                    {rec.priority}
                  </Badge>
                  <span className="text-foreground text-sm font-medium">
                    {rec.problem}
                  </span>
                </div>
                {rec.reason && (
                  <p className="text-muted-foreground pl-1 text-sm">
                    {rec.reason}
                  </p>
                )}
                {rec.suggestion && (
                  <p className="text-info pl-1 text-sm">{rec.suggestion}</p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
