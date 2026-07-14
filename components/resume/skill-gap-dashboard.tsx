"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SkillGapReportView } from "@/components/resume/skill-gap-report";
import { useAiJob, useAiJobs } from "@/components/providers/ai-jobs-provider";
import type { SkillGapAnalysisItem, SkillGapAnalysisListItem } from "@/types/skill-gap";

type Props = {
  resumeId: string;
  initialAnalyses: SkillGapAnalysisListItem[];
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

export function SkillGapDashboard({ resumeId, initialAnalyses }: Props) {
  const { trackJob } = useAiJobs();
  const [analyses, setAnalyses] = useState<SkillGapAnalysisListItem[]>(initialAnalyses);
  const [latest, setLatest] = useState<SkillGapAnalysisItem | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeJob = useAiJob(activeJobId);

  const isGenerating =
    isSubmitting ||
    (activeJob !== null &&
      activeJob.status !== "COMPLETED" &&
      activeJob.status !== "FAILED");

  const refreshAnalyses = async () => {
    const response = await fetch(`/api/resumes/${resumeId}/skill-gap`);
    const data = await response.json().catch(() => null);
    if (response.ok) {
      setAnalyses(data.analyses as SkillGapAnalysisListItem[]);
    }
  };

  useEffect(() => {
    if (!activeJob) return;

    if (activeJob.status === "COMPLETED") {
      setLatest(activeJob.result as SkillGapAnalysisItem);
      void refreshAnalyses();
    } else if (activeJob.status === "FAILED") {
      setError(activeJob.error ?? GENERIC_ERROR);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob?.status]);

  const handleGenerate = async (file?: File) => {
    if (!file && jobDescription.trim().length < 20) {
      setError("Paste a fuller job description (at least 20 characters).");
      return;
    }

    setError(null);
    setActiveJobId(null);
    setIsSubmitting(true);

    try {
      let response: Response;
      if (file) {
        const formData = new FormData();
        formData.set("file", file);
        response = await fetch(`/api/resumes/${resumeId}/skill-gap`, {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch(`/api/resumes/${resumeId}/skill-gap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription }),
        });
      }

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      const jobId = data.jobId as string;
      trackJob({ id: jobId, resumeId, type: "SKILL_GAP_ANALYSIS" });
      setActiveJobId(jobId);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleGenerate(file);
    event.target.value = "";
  };

  const handleDelete = async (analysisId: string) => {
    setError(null);
    setDeletingId(analysisId);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/skill-gap/${analysisId}`,
        { method: "DELETE" },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      if (latest?.id === analysisId) {
        setLatest(null);
      }
      await refreshAnalyses();
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="gap-4 p-4">
        <Tabs defaultValue="paste">
          <TabsList>
            <TabsTrigger value="paste">Paste text</TabsTrigger>
            <TabsTrigger value="upload">Upload file</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="flex flex-col gap-3">
            <Textarea
              placeholder="Paste the target job description here..."
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              rows={8}
            />
            <Button
              type="button"
              className="self-start"
              disabled={isGenerating}
              onClick={() => handleGenerate()}
            >
              {isGenerating && <Spinner />}
              {isGenerating ? "Analyzing..." : "Analyze skill gap"}
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
              Upload the job description as a PDF or DOCX file.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              className="self-start"
              disabled={isGenerating}
              onClick={() => fileInputRef.current?.click()}
            >
              {isGenerating && <Spinner />}
              {isGenerating ? "Analyzing..." : "Choose file"}
            </Button>
          </TabsContent>
        </Tabs>
      </Card>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {latest && <SkillGapReportView report={latest.content} />}

      <div className="flex flex-col gap-3">
        <h2 className="text-foreground font-semibold">Analysis history</h2>
        {analyses.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No analyses yet. Provide a job description above to get started.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {analyses.map((analysis) => (
              <li key={analysis.id}>
                <Card className="flex-row flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-foreground font-medium">
                      Overall match:{" "}
                      <span className={scoreColor(analysis.overallScore)}>
                        {analysis.overallScore}/100
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(analysis.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/dashboard/resumes/${resumeId}/skill-gap/${analysis.id}`}
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
                          disabled={deletingId === analysis.id}
                        >
                          {deletingId === analysis.id && <Spinner />}
                          {deletingId === analysis.id ? "Deleting..." : "Delete"}
                        </Button>
                      }
                      title="Delete this analysis?"
                      description="This cannot be undone."
                      confirmLabel="Delete"
                      onConfirm={() => handleDelete(analysis.id)}
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
