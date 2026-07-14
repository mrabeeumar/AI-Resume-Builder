"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAiJob, useAiJobs } from "@/components/providers/ai-jobs-provider";
import type { TailoringResponse } from "@/types/resume-tailoring";

type Props = {
  resumeId: string;
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

const SCORE_ROWS: { key: keyof TailoringResponse["matchScore"]; label: string }[] = [
  { key: "overallScore", label: "Overall match" },
  { key: "skillMatchScore", label: "Skill match" },
  { key: "experienceMatchScore", label: "Experience match" },
  { key: "atsScore", label: "ATS score" },
  { key: "keywordCoverageScore", label: "Keyword coverage" },
];

function scoreColor(score: number) {
  if (score >= 80) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-destructive";
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">{label}</span>
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
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Card className="gap-2 p-4">
      <h3 className="text-foreground font-semibold">{title}</h3>
      <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}

export function TailoringPanel({ resumeId }: Props) {
  const { trackJob } = useAiJobs();
  const [jobDescription, setJobDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [localResult, setLocalResult] = useState<TailoringResponse | null>(
    null,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [savedVersionId, setSavedVersionId] = useState<string | null>(null);
  const [isCreatingApplication, setIsCreatingApplication] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);

  const activeJob = useAiJob(activeJobId);

  const isGenerating =
    isSubmitting ||
    (activeJob !== null &&
      activeJob.status !== "COMPLETED" &&
      activeJob.status !== "FAILED");
  const result =
    activeJob?.status === "COMPLETED"
      ? (activeJob.result as TailoringResponse)
      : localResult;
  const error =
    activeJob?.status === "FAILED"
      ? (activeJob.error ?? GENERIC_ERROR)
      : submitError;

  const handleGenerate = async (file?: File) => {
    if (!file && jobDescription.trim().length < 20) {
      setSubmitError("Paste a fuller job description (at least 20 characters).");
      return;
    }

    setSubmitError(null);
    setLocalResult(null);
    setActiveJobId(null);
    setSavedVersionId(null);
    setIsSubmitting(true);

    try {
      let response: Response;
      if (file) {
        const formData = new FormData();
        formData.set("file", file);
        response = await fetch(`/api/resumes/${resumeId}/tailor`, {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch(`/api/resumes/${resumeId}/tailor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription }),
        });
      }

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(data?.error ?? GENERIC_ERROR);
        return;
      }

      const jobId = data.jobId as string;
      trackJob({ id: jobId, resumeId, type: "RESUME_TAILORING" });
      setActiveJobId(jobId);
    } catch {
      setSubmitError(GENERIC_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inherits the resume version, job description, company, and position from
  // this tailoring session — no duplicate data entry (see roadmap M21
  // "Method 3 — Create From Resume Tailoring").
  const handleCreateApplication = async () => {
    if (!result || !savedVersionId) return;

    setApplicationError(null);
    setIsCreatingApplication(true);
    try {
      const response = await fetch("/api/applications/from-tailoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          resumeVersionId: savedVersionId,
          jobDescriptionId: result.jobDescriptionId ?? undefined,
          company: result.jobAnalysis.company.name || "Unknown Company",
          position: result.jobTitle || result.jobAnalysis.position.title || "Unknown Position",
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setApplicationError(data?.error ?? GENERIC_ERROR);
        return;
      }

      setApplicationId(data.application.id as string);
    } catch {
      setApplicationError(GENERIC_ERROR);
    } finally {
      setIsCreatingApplication(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleGenerate(file);
    event.target.value = "";
  };

  const handleSave = async () => {
    if (!result) return;

    setSubmitError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/tailor/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: saveNote.trim() || undefined,
          jobDescriptionId: result.jobDescriptionId,
          jobTitle: result.jobTitle,
          jobAnalysis: result.jobAnalysis,
          tailored: result.tailored,
          matchScore: result.matchScore,
          confidence: result.confidence,
          summary: result.summary,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setSubmitError(data?.error ?? GENERIC_ERROR);
        return;
      }

      setSavedVersionId(data.version.id as string);
    } catch {
      setSubmitError(GENERIC_ERROR);
    } finally {
      setIsSaving(false);
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
              {isGenerating ? "Tailoring..." : "Generate tailored resume"}
            </Button>
            {isGenerating && (
              <p className="text-muted-foreground text-xs">
                This keeps running in the background — feel free to navigate
                away, we&apos;ll notify you when it&apos;s done.
              </p>
            )}
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
              {isGenerating ? "Tailoring..." : "Choose file"}
            </Button>
          </TabsContent>
        </Tabs>
      </Card>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-6">
          {result.warnings.length > 0 && (
            <Card className="border-warning gap-2 p-4">
              <h3 className="text-foreground font-semibold">Warnings</h3>
              <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm">
                {result.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="gap-4 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground font-semibold">Match score</h2>
              <Badge variant={result.confidence >= 60 ? "success" : "warning"}>
                {result.confidence}% confidence
              </Badge>
            </div>
            <div className="flex flex-col gap-3">
              {SCORE_ROWS.map((row) => (
                <ScoreBar
                  key={row.key}
                  label={row.label}
                  score={result.matchScore[row.key]}
                />
              ))}
            </div>
          </Card>

          <Card className="gap-3 p-4">
            <h2 className="text-foreground font-semibold">
              Tailored summary
            </h2>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {result.tailored.summary || "No changes suggested."}
            </p>
          </Card>

          {result.tailored.skills.length > 0 && (
            <Card className="gap-2 p-4">
              <h3 className="text-foreground font-semibold">
                Reordered skills
              </h3>
              <ul className="flex flex-wrap gap-2">
                {result.tailored.skills.map((skill) => (
                  <li key={skill}>
                    <Badge>{skill}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <SummaryList
            title="Overall improvements"
            items={result.summary.overallImprovements}
          />
          <SummaryList
            title="Sections modified"
            items={result.summary.sectionsModified}
          />
          <SummaryList
            title="Keywords incorporated"
            items={result.summary.keywordsIncorporated}
          />
          <SummaryList
            title="Missing skills"
            items={result.summary.missingSkillsIdentified}
          />
          <SummaryList
            title="Recommendations"
            items={result.summary.recommendations}
          />

          <Card className="gap-3 p-4">
            <h2 className="text-foreground font-semibold">
              Save as a new version
            </h2>
            <p className="text-muted-foreground text-sm">
              This creates a new resume version — your current resume is not
              changed. You can restore it later from version history.
            </p>
            <Input
              placeholder="Note (optional)"
              value={saveNote}
              onChange={(event) => setSaveNote(event.target.value)}
            />
            {savedVersionId ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="success">Saved</Badge>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/resumes/${resumeId}/versions`}>
                      View in version history
                    </Link>
                  </Button>
                  {applicationId ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/applications/${applicationId}`}>
                        Open job workspace
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isCreatingApplication}
                      onClick={handleCreateApplication}
                    >
                      {isCreatingApplication && <Spinner />}
                      {isCreatingApplication
                        ? "Creating..."
                        : "Create job workspace"}
                    </Button>
                  )}
                </div>
                {applicationError && (
                  <p role="alert" className="text-destructive text-sm">
                    {applicationError}
                  </p>
                )}
              </div>
            ) : (
              <Button
                type="button"
                className="self-start"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving && <Spinner />}
                {isSaving ? "Saving..." : "Save tailored resume"}
              </Button>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
