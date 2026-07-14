"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type TrackedAiJob = {
  id: string;
  resumeId: string;
  type: string;
  status: string;
  result: unknown;
  error: string | null;
};

type AiJobsContextValue = {
  jobs: Record<string, TrackedAiJob>;
  trackJob: (job: { id: string; resumeId: string; type: string }) => void;
};

const AiJobsContext = createContext<AiJobsContextValue | null>(null);

const POLL_INTERVAL_MS = 3000;

const JOB_LABELS: Record<string, string> = {
  RESUME_TAILORING: "Resume tailoring",
  RESUME_REVIEW: "Resume review",
  ATS_ANALYSIS: "ATS analysis",
  SKILL_GAP_ANALYSIS: "Skill gap analysis",
};

function jobLink(resumeId: string, type: string) {
  switch (type) {
    case "RESUME_TAILORING":
      return `/dashboard/resumes/${resumeId}/tailor`;
    case "RESUME_REVIEW":
      return `/dashboard/resumes/${resumeId}/review`;
    case "ATS_ANALYSIS":
      return `/dashboard/resumes/${resumeId}/ats-report`;
    case "SKILL_GAP_ANALYSIS":
      return `/dashboard/resumes/${resumeId}/skill-gap`;
    default:
      return `/dashboard/resumes/${resumeId}`;
  }
}

function isTerminal(status: string) {
  return status === "COMPLETED" || status === "FAILED";
}

export function AiJobsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Record<string, TrackedAiJob>>({});
  const jobsRef = useRef(jobs);

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  const notifyIfTerminal = useCallback(
    (previous: TrackedAiJob | undefined, next: TrackedAiJob) => {
      if (previous && !isTerminal(previous.status) && isTerminal(next.status)) {
        const label = JOB_LABELS[next.type] ?? "AI task";
        if (next.status === "COMPLETED") {
          toast.success(`${label} finished`, {
            description: "Your result is ready to view.",
            action: {
              label: "View",
              onClick: () => router.push(jobLink(next.resumeId, next.type)),
            },
          });
        } else {
          toast.error(`${label} failed`, {
            description: next.error ?? "Something went wrong. Please try again.",
          });
        }
      }
    },
    [router],
  );

  const pollJob = useCallback(
    async (jobId: string) => {
      const response = await fetch(`/api/ai-jobs/${jobId}`);
      if (!response.ok) return;

      const data = await response.json().catch(() => null);
      if (!data?.job) return;

      const next: TrackedAiJob = {
        id: data.job.id,
        resumeId: data.job.resumeId,
        type: data.job.type,
        status: data.job.status,
        result: data.job.result,
        error: data.job.error,
      };

      setJobs((prev) => {
        notifyIfTerminal(prev[jobId], next);
        return { ...prev, [jobId]: next };
      });
    },
    [notifyIfTerminal],
  );

  const trackJob = useCallback(
    (job: { id: string; resumeId: string; type: string }) => {
      setJobs((prev) => ({
        ...prev,
        [job.id]: {
          id: job.id,
          resumeId: job.resumeId,
          type: job.type,
          status: "PENDING",
          result: null,
          error: null,
        },
      }));
      void pollJob(job.id);
    },
    [pollJob],
  );

  // Reattach to jobs still running from a previous page load (e.g. the tab
  // was reopened while an AI task was in flight).
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const response = await fetch("/api/ai-jobs");
      if (!response.ok || cancelled) return;

      const data = await response.json().catch(() => null);
      const activeJobs = (data?.jobs ?? []) as Array<{
        id: string;
        resumeId: string;
        type: string;
        status: string;
        result: unknown;
        error: string | null;
      }>;

      if (activeJobs.length === 0) return;

      setJobs((prev) => {
        const next = { ...prev };
        for (const job of activeJobs) {
          if (!next[job.id]) {
            next[job.id] = job;
          }
        }
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // A single interval polls every non-terminal job. Mounted once at the app
  // root (see app/layout.tsx), so it keeps running across client-side
  // navigation — the AI work itself already continues server-side
  // regardless (see `after()` in the AI API routes), this just makes sure
  // the user is notified whenever they left the page mid-generation.
  useEffect(() => {
    const interval = setInterval(() => {
      const active = Object.values(jobsRef.current).filter(
        (job) => !isTerminal(job.status),
      );
      for (const job of active) {
        void pollJob(job.id);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [pollJob]);

  return (
    <AiJobsContext.Provider value={{ jobs, trackJob }}>
      {children}
    </AiJobsContext.Provider>
  );
}

export function useAiJobs() {
  const context = useContext(AiJobsContext);
  if (!context) {
    throw new Error("useAiJobs must be used within an AiJobsProvider.");
  }
  return context;
}

export function useAiJob(jobId: string | null) {
  const { jobs } = useAiJobs();
  return jobId ? (jobs[jobId] ?? null) : null;
}
