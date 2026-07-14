import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { InterviewReport } from "@/types/interview";

const READINESS_LABEL: Record<InterviewReport["hiringReadiness"], string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  STRONG_CANDIDATE: "Strong candidate",
  INTERVIEW_READY: "Interview ready",
};

const READINESS_VARIANT: Record<
  InterviewReport["hiringReadiness"],
  "destructive" | "warning" | "info" | "success"
> = {
  BEGINNER: "destructive",
  INTERMEDIATE: "warning",
  STRONG_CANDIDATE: "info",
  INTERVIEW_READY: "success",
};

function scoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

function ScoreTile({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border p-3">
      <span className={`text-2xl font-semibold ${scoreColor(score)}`}>{score}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-foreground mb-1 font-medium">{title}</h3>
      <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function InterviewReportView({ report }: { report: InterviewReport }) {
  return (
    <Card className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">Overall score</p>
          <p className={`text-4xl font-bold ${scoreColor(report.overallScore)}`}>
            {report.overallScore}/100
          </p>
        </div>
        <Badge variant={READINESS_VARIANT[report.hiringReadiness]}>
          {READINESS_LABEL[report.hiringReadiness]}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ScoreTile label="Technical" score={report.technicalScore} />
        <ScoreTile label="Communication" score={report.communicationScore} />
        <ScoreTile label="Confidence" score={report.confidenceScore} />
        <ScoreTile label="Behavioral" score={report.behavioralScore} />
      </div>

      {report.summary && (
        <p className="text-foreground text-sm">{report.summary}</p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <List title="Strengths" items={report.strengths} />
        <List title="Weaknesses" items={report.weaknesses} />
        <List title="Frequently missed topics" items={report.frequentlyMissedTopics} />
        <List title="Topics to study" items={report.improvementPlan.topicsToStudy} />
        <List title="Projects to improve" items={report.improvementPlan.projectsToImprove} />
        <List title="Practice areas" items={report.improvementPlan.practiceAreas} />
      </div>
    </Card>
  );
}
