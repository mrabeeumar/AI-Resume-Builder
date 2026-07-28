"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { AtsReportContent } from "@/components/resume/ats-report-content";
import { useAiJob, useAiJobs } from "@/components/providers/ai-jobs-provider";
import type { AtsReportItem, AtsReportListItem } from "@/types/ai";

type Props = {
  resumeId: string;
  initialReports: AtsReportListItem[];
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString();
}

function scoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

export function AtsReportView({ resumeId, initialReports }: Props) {
  const { trackJob } = useAiJobs();
  const [reports, setReports] = useState<AtsReportListItem[]>(initialReports);
  const [jobDescription, setJobDescription] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const refreshedJobIdRef = useRef<string | null>(null);

  const activeJob = useAiJob(activeJobId);

  const isAnalyzing =
    isSubmitting ||
    (activeJob !== null &&
      activeJob.status !== "COMPLETED" &&
      activeJob.status !== "FAILED");
  const latest =
    activeJob?.status === "COMPLETED"
      ? (activeJob.result as AtsReportItem)
      : null;
  const error =
    activeJob?.status === "FAILED"
      ? (activeJob.error ?? GENERIC_ERROR)
      : submitError;

  const refreshReports = async () => {
    const response = await fetch(`/api/resumes/${resumeId}/ats-analysis`);
    const data = await response.json().catch(() => null);
    if (response.ok) {
      setReports(data.reports as AtsReportListItem[]);
    }
  };

  useEffect(() => {
    if (
      activeJob?.status === "COMPLETED" &&
      refreshedJobIdRef.current !== activeJob.id
    ) {
      refreshedJobIdRef.current = activeJob.id;
      void refreshReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob]);

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

  const handleDelete = async (reportId: string) => {
    setSubmitError(null);
    setDeletingId(reportId);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/ats-analysis/${reportId}`,
        { method: "DELETE" },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(data?.error ?? GENERIC_ERROR);
        return;
      }

      if (latest?.id === reportId) {
        setActiveJobId(null);
      }
      await refreshReports();
    } catch {
      setSubmitError(GENERIC_ERROR);
    } finally {
      setDeletingId(null);
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

      {latest && <AtsReportContent report={latest.content} />}

      <div className="flex flex-col gap-3">
        <h2 className="text-foreground font-semibold">Report history</h2>
        {reports.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No ATS reports yet. Run an analysis above to see how this resume
            scores against applicant tracking systems.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reports.map((report) => (
              <li key={report.id}>
                <Card className="flex-row flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-foreground font-medium">
                      Overall score:{" "}
                      <span className={scoreColor(report.overallScore)}>
                        {report.overallScore}/100
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(report.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/dashboard/resumes/${resumeId}/ats-report/${report.id}`}
                      >
                        View details
                      </Link>
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={deletingId === report.id}
                        >
                          {deletingId === report.id ? "Deleting..." : "Delete"}
                        </Button>
                      }
                      title="Delete this report?"
                      description="This cannot be undone."
                      confirmLabel="Delete"
                      onConfirm={() => handleDelete(report.id)}
                    />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
