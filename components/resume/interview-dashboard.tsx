"use client";

import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { InterviewReportView } from "@/components/resume/interview-report-view";
import { InterviewSetupForm } from "@/components/resume/interview-setup-form";
import type {
  EndInterviewReply,
  InterviewQuestionItem,
  InterviewSessionListItem,
  StartInterviewReply,
  SubmitInterviewAnswerReply,
} from "@/types/interview";

type Props = {
  resumeId: string;
  initialSessions: InterviewSessionListItem[];
};

type View = "history" | "setup" | "session" | "report";

const GENERIC_ERROR = "Something went wrong. Please try again.";

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  RESUME: "Resume interview",
  TECHNICAL: "Technical",
  HR: "HR",
  BEHAVIORAL: "Behavioral",
  MIXED: "Mixed",
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString();
}

function scoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

export function InterviewDashboard({ resumeId, initialSessions }: Props) {
  const [sessions, setSessions] = useState<InterviewSessionListItem[]>(initialSessions);
  const [view, setView] = useState<View>("history");
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<string>("");
  const [questions, setQuestions] = useState<InterviewQuestionItem[]>([]);
  const [feedbackMode, setFeedbackMode] = useState<"AFTER_EACH_QUESTION" | "END_ONLY">(
    "AFTER_EACH_QUESTION",
  );
  const [completed, setCompleted] = useState(false);
  const [report, setReport] = useState<EndInterviewReply["session"]["finalReport"]>(null);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [questions.length]);

  const refreshHistory = async () => {
    const response = await fetch(`/api/resumes/${resumeId}/interviews`);
    const data = await response.json().catch(() => null);
    if (response.ok) {
      setSessions(data.sessions as InterviewSessionListItem[]);
    }
  };

  const handleStarted = (reply: StartInterviewReply) => {
    setInterviewId(reply.session.id);
    setGreeting(reply.greeting);
    setQuestions([reply.firstQuestion]);
    setFeedbackMode(reply.session.feedbackMode);
    setCompleted(false);
    setReport(null);
    setAnswer("");
    setError(null);
    setView("session");
    void refreshHistory();
  };

  const handleResume = async (session: InterviewSessionListItem) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/interviews/${session.id}`,
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      const interview = data.interview as InterviewSessionListItem & {
        questions: InterviewQuestionItem[];
        finalReport: EndInterviewReply["session"]["finalReport"];
      };

      setInterviewId(interview.id);
      setQuestions(interview.questions);
      setFeedbackMode(interview.feedbackMode);
      setGreeting("");
      setAnswer("");

      if (interview.status === "COMPLETED" && interview.finalReport) {
        setReport(interview.finalReport);
        setCompleted(true);
        setView("report");
      } else {
        const hasOpenQuestion = interview.questions.some((q) => !q.userAnswer);
        setCompleted(!hasOpenQuestion);
        setView("session");
      }
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!interviewId || !answer.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/interviews/${interviewId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: answer.trim() }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      const reply = data.reply as SubmitInterviewAnswerReply;
      setQuestions((prev) => {
        const next = prev.map((q) =>
          q.id === reply.evaluatedQuestion.id ? reply.evaluatedQuestion : q,
        );
        return reply.nextQuestion ? [...next, reply.nextQuestion] : next;
      });
      setAnswer("");
      setCompleted(reply.completed);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndInterview = async () => {
    if (!interviewId) return;

    setError(null);
    setIsEnding(true);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/interviews/${interviewId}/end`,
        { method: "POST" },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      const reply = data as EndInterviewReply;
      setReport(reply.session.finalReport);
      setQuestions(reply.session.questions);
      setView("report");
      void refreshHistory();
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setIsEnding(false);
    }
  };

  const currentQuestion = questions.find((q) => !q.userAnswer) ?? null;
  const answeredQuestions = questions.filter((q) => q.userAnswer);

  return (
    <div className="flex flex-col gap-6">
      {view === "history" && (
        <>
          <Card className="flex flex-col items-start gap-3 p-5">
            <p className="text-muted-foreground text-sm">
              Practice a mock interview based on this resume. The AI asks
              personalized questions, evaluates your answers, and generates a
              full report at the end.
            </p>
            <Button type="button" onClick={() => setView("setup")}>
              New interview
            </Button>
          </Card>

          <div className="flex flex-col gap-3">
            <h2 className="text-foreground font-semibold">Interview history</h2>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No interviews yet. Start one above to get started.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {sessions.map((session) => (
                  <li key={session.id}>
                    <Card className="flex-row flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-foreground font-medium">
                          {INTERVIEW_TYPE_LABELS[session.interviewType]} —{" "}
                          {session.status === "COMPLETED" && session.overallScore !== null ? (
                            <span className={scoreColor(session.overallScore)}>
                              {session.overallScore}/100
                            </span>
                          ) : (
                            <Badge variant={session.status === "IN_PROGRESS" ? "info" : "secondary"}>
                              {session.status === "IN_PROGRESS" ? "In progress" : "Abandoned"}
                            </Badge>
                          )}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(session.startedAt)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleResume(session)}
                      >
                        {session.status === "COMPLETED" ? "View report" : "Continue"}
                      </Button>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {view === "setup" && (
        <InterviewSetupForm
          resumeId={resumeId}
          onStarted={handleStarted}
          onCancel={() => setView("history")}
        />
      )}

      {view === "session" && (
        <Card className="flex flex-col gap-4 p-5">
          {greeting && <p className="text-muted-foreground text-sm">{greeting}</p>}

          <div className="flex flex-col gap-4">
            {answeredQuestions.map((question) => (
              <div key={question.id} className="flex flex-col gap-2">
                <div className="bg-muted text-foreground max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap">
                  {question.question}
                </div>
                <div className="bg-primary text-primary-foreground ml-auto max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap">
                  {question.userAnswer}
                </div>
                {feedbackMode === "AFTER_EACH_QUESTION" && question.aiEvaluation && (
                  <Card className="gap-2 p-3">
                    <p className="text-sm font-medium">
                      Score:{" "}
                      <span className={scoreColor(question.score ?? 0)}>
                        {question.score}/100
                      </span>
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {question.aiEvaluation.feedback}
                    </p>
                  </Card>
                )}
              </div>
            ))}

            {currentQuestion && (
              <div className="bg-muted text-foreground max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap">
                {currentQuestion.question}
              </div>
            )}

            <div ref={endRef} />
          </div>

          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}

          {currentQuestion && !completed ? (
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmitAnswer();
              }}
            >
              <Textarea
                rows={3}
                placeholder="Type your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="resize-none"
              />
              <Button type="submit" disabled={isSubmitting || !answer.trim()}>
                {isSubmitting && <Spinner />}
                {isSubmitting ? "Sending..." : "Answer"}
              </Button>
            </form>
          ) : (
            <p className="text-muted-foreground text-sm">
              {completed
                ? "You've reached the question limit for this interview."
                : "This interview has no more open questions."}
            </p>
          )}

          <div className="flex gap-2">
            <ConfirmDialog
              trigger={
                <Button type="button" variant="outline" disabled={isEnding}>
                  {isEnding && <Spinner />}
                  {isEnding ? "Generating report..." : "End interview & get report"}
                </Button>
              }
              title="End this interview?"
              description="This generates your final report from the questions answered so far."
              confirmLabel="End interview"
              onConfirm={handleEndInterview}
            />
            <Button type="button" variant="ghost" onClick={() => setView("history")}>
              Back to history
            </Button>
          </div>
        </Card>
      )}

      {view === "report" && report && (
        <div className="flex flex-col gap-4">
          <InterviewReportView report={report} />
          <Button type="button" variant="outline" className="self-start" onClick={() => setView("history")}>
            Back to history
          </Button>
        </div>
      )}
    </div>
  );
}
