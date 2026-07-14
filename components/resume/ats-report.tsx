"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAiJob, useAiJobs } from "@/components/providers/ai-jobs-provider";
import { SECTION_TYPE_LABELS } from "@/types/resume-section";
import type { AtsReport } from "@/types/ai";

type Props = {
  resumeId: string;
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

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

export function AtsReportView({ resumeId }: Props) {
  const { trackJob } = useAiJobs();
  const [jobDescription, setJobDescription] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeJob = useAiJob(activeJobId);

  const isAnalyzing =
    isSubmitting ||
    (activeJob !== null &&
      activeJob.status !== "COMPLETED" &&
      activeJob.status !== "FAILED");
  const report =
    activeJob?.status === "COMPLETED" ? (activeJob.result as AtsReport) : null;
  const error =
    activeJob?.status === "FAILED"
      ? (activeJob.error ?? GENERIC_ERROR)
      : submitError;

  const handleAnalyze = async () => {
    setSubmitError(null);
    setActiveJobId(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/ats-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(data?.error ?? GENERIC_ERROR);
        return;
      }

      const jobId = data.jobId as string;
      setActiveJobId(jobId);
      trackJob({ id: jobId, resumeId, type: "ATS_ANALYSIS" });
    } catch {
      setSubmitError(GENERIC_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="job-description"
          className="text-foreground text-sm font-medium"
        >
          Target job description (optional)
        </label>
        <Textarea
          id="job-description"
          placeholder="Paste a job description to get a job match score and tailored suggestions."
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          rows={6}
        />
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <div>
        <Button type="button" disabled={isAnalyzing} onClick={handleAnalyze}>
          {isAnalyzing && <Spinner />}
          {isAnalyzing ? "Analyzing..." : "Run ATS analysis"}
        </Button>
        {isAnalyzing && (
          <p className="text-muted-foreground mt-2 text-xs">
            This keeps running in the background — feel free to navigate
            away, we&apos;ll notify you when it&apos;s done.
          </p>
        )}
      </div>

      {!report && !isAnalyzing && !error && (
        <EmptyState
          title="No ATS report yet"
          description="Run an analysis to see how this resume scores against applicant tracking systems."
        />
      )}

      {report && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            {SCORE_ROWS.filter(
              (row) =>
                row.key !== "jobMatchScore" || report.jobMatchScore !== null,
            ).map((row) => {
              const score = (report[row.key] as number | null) ?? 0;
              return (
                <div key={row.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">
                      {row.label}
                    </span>
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
              <h2 className="text-foreground font-semibold">
                Missing sections
              </h2>
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
              <h2 className="text-foreground font-semibold">
                Missing keywords
              </h2>
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
      )}
    </div>
  );
}
