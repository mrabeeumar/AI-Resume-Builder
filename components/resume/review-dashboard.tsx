"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { ReviewReportView } from "@/components/resume/review-report";
import { useAiJob, useAiJobs } from "@/components/providers/ai-jobs-provider";
import type { ResumeReviewItem, ResumeReviewListItem } from "@/types/resume-review";

type Props = {
  resumeId: string;
  initialReviews: ResumeReviewListItem[];
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

export function ReviewDashboard({ resumeId, initialReviews }: Props) {
  const { trackJob } = useAiJobs();
  const [reviews, setReviews] = useState<ResumeReviewListItem[]>(initialReviews);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const refreshedJobIdRef = useRef<string | null>(null);

  const activeJob = useAiJob(activeJobId);

  const isGenerating =
    isSubmitting ||
    (activeJob !== null &&
      activeJob.status !== "COMPLETED" &&
      activeJob.status !== "FAILED");
  const latest =
    activeJob?.status === "COMPLETED"
      ? (activeJob.result as ResumeReviewItem)
      : null;
  const error =
    activeJob?.status === "FAILED"
      ? (activeJob.error ?? GENERIC_ERROR)
      : submitError;

  const refreshReviews = async () => {
    const response = await fetch(`/api/resumes/${resumeId}/review`);
    const data = await response.json().catch(() => null);
    if (response.ok) {
      setReviews(data.reviews as ResumeReviewListItem[]);
    }
  };

  useEffect(() => {
    if (
      activeJob?.status === "COMPLETED" &&
      refreshedJobIdRef.current !== activeJob.id
    ) {
      refreshedJobIdRef.current = activeJob.id;
      void refreshReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob]);

  const handleGenerate = async () => {
    setSubmitError(null);
    setActiveJobId(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(data?.error ?? GENERIC_ERROR);
        return;
      }

      const jobId = data.jobId as string;
      trackJob({ id: jobId, resumeId, type: "RESUME_REVIEW" });
      setActiveJobId(jobId);
    } catch {
      setSubmitError(GENERIC_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    setSubmitError(null);
    setDeletingId(reviewId);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/review/${reviewId}`,
        { method: "DELETE" },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(data?.error ?? GENERIC_ERROR);
        return;
      }

      if (latest?.id === reviewId) {
        setActiveJobId(null);
      }
      await refreshReviews();
    } catch {
      setSubmitError(GENERIC_ERROR);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <div>
        <Button type="button" disabled={isGenerating} onClick={handleGenerate}>
          {isGenerating && <Spinner />}
          {isGenerating ? "Analyzing resume..." : "Run resume review"}
        </Button>
        {isGenerating && (
          <p className="text-muted-foreground mt-2 text-xs">
            This keeps running in the background — feel free to navigate
            away, we&apos;ll notify you when it&apos;s done.
          </p>
        )}
      </div>

      {latest && <ReviewReportView report={latest.content} />}

      <div className="flex flex-col gap-3">
        <h2 className="text-foreground font-semibold">Review history</h2>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No reviews yet. Run a review above to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((review) => (
              <li key={review.id}>
                <Card className="flex-row flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-foreground font-medium">
                      Overall score:{" "}
                      <span className={scoreColor(review.overallScore)}>
                        {review.overallScore}/100
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/dashboard/resumes/${resumeId}/review/${review.id}`}
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
                          disabled={deletingId === review.id}
                        >
                          {deletingId === review.id ? "Deleting..." : "Delete"}
                        </Button>
                      }
                      title="Delete this review?"
                      description="This cannot be undone."
                      confirmLabel="Delete"
                      onConfirm={() => handleDelete(review.id)}
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
