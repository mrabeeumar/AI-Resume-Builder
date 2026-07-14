"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  INTERVIEW_DIFFICULTIES,
  INTERVIEW_FEEDBACK_MODES,
  INTERVIEW_QUESTION_COUNTS,
  INTERVIEW_TYPES,
  type InterviewDifficulty,
  type InterviewFeedbackMode,
  type InterviewQuestionCount,
  type InterviewType,
} from "@/lib/enums";
import type { JobDescriptionListItem } from "@/types/job-description";
import type { CoverLetterListItem } from "@/types/cover-letter";
import type { StartInterviewReply } from "@/types/interview";

type Props = {
  resumeId: string;
  onStarted: (reply: StartInterviewReply) => void;
  onCancel: () => void;
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  RESUME: "Resume interview",
  TECHNICAL: "Technical",
  HR: "HR",
  BEHAVIORAL: "Behavioral",
  MIXED: "Mixed",
};

const DIFFICULTY_LABELS: Record<InterviewDifficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

const FEEDBACK_MODE_LABELS: Record<InterviewFeedbackMode, string> = {
  AFTER_EACH_QUESTION: "After every question",
  END_ONLY: "At the end only",
};

function OptionGroup<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={option === value ? "default" : "outline"}
          onClick={() => onChange(option)}
        >
          {labels[option]}
        </Button>
      ))}
    </div>
  );
}

export function InterviewSetupForm({ resumeId, onStarted, onCancel }: Props) {
  const [interviewType, setInterviewType] = useState<InterviewType>("MIXED");
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>("MEDIUM");
  const [questionCount, setQuestionCount] = useState<InterviewQuestionCount | null>(10);
  const [feedbackMode, setFeedbackMode] = useState<InterviewFeedbackMode>(
    "AFTER_EACH_QUESTION",
  );
  const [jobDescriptionId, setJobDescriptionId] = useState<string>("");
  const [coverLetterId, setCoverLetterId] = useState<string>("");
  const [jobDescriptions, setJobDescriptions] = useState<JobDescriptionListItem[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetterListItem[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/job-descriptions")
      .then((res) => res.json())
      .then((data) => setJobDescriptions(data?.jobDescriptions ?? []))
      .catch(() => undefined);
    void fetch("/api/cover-letters")
      .then((res) => res.json())
      .then((data) => setCoverLetters(data?.coverLetters ?? []))
      .catch(() => undefined);
  }, []);

  const handleStart = async () => {
    setError(null);
    setIsStarting(true);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewType,
          difficulty,
          questionCount,
          feedbackMode,
          jobDescriptionId: jobDescriptionId || undefined,
          coverLetterId: coverLetterId || undefined,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      onStarted(data.interview as StartInterviewReply);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Card className="flex flex-col gap-5 p-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-foreground text-sm font-medium">Interview type</h3>
        <OptionGroup
          options={INTERVIEW_TYPES}
          labels={INTERVIEW_TYPE_LABELS}
          value={interviewType}
          onChange={setInterviewType}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-foreground text-sm font-medium">Difficulty</h3>
        <OptionGroup
          options={INTERVIEW_DIFFICULTIES}
          labels={DIFFICULTY_LABELS}
          value={difficulty}
          onChange={setDifficulty}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-foreground text-sm font-medium">Questions</h3>
        <div className="flex flex-wrap gap-2">
          {INTERVIEW_QUESTION_COUNTS.map((count) => (
            <Button
              key={count}
              type="button"
              size="sm"
              variant={questionCount === count ? "default" : "outline"}
              onClick={() => setQuestionCount(count)}
            >
              {count}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant={questionCount === null ? "default" : "outline"}
            onClick={() => setQuestionCount(null)}
          >
            Unlimited
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-foreground text-sm font-medium">Feedback</h3>
        <OptionGroup
          options={INTERVIEW_FEEDBACK_MODES}
          labels={FEEDBACK_MODE_LABELS}
          value={feedbackMode}
          onChange={setFeedbackMode}
        />
      </div>

      {jobDescriptions.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-sm font-medium">
            Job description <span className="text-muted-foreground">(optional)</span>
          </h3>
          <select
            className={cn(
              "border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none",
            )}
            value={jobDescriptionId}
            onChange={(event) => setJobDescriptionId(event.target.value)}
          >
            <option value="">None</option>
            {jobDescriptions.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
                {job.company ? ` — ${job.company}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {coverLetters.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-sm font-medium">
            Cover letter <span className="text-muted-foreground">(optional)</span>
          </h3>
          <select
            className={cn(
              "border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none",
            )}
            value={coverLetterId}
            onChange={(event) => setCoverLetterId(event.target.value)}
          >
            <option value="">None</option>
            {coverLetters.map((letter) => (
              <option key={letter.id} value={letter.id}>
                {letter.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="button" disabled={isStarting} onClick={handleStart}>
          {isStarting && <Spinner />}
          {isStarting ? "Starting..." : "Start interview"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isStarting}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
