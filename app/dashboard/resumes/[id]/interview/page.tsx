import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BackButton } from "@/components/layout/back-button";
import { Container } from "@/components/layout/container";
import { InterviewDashboard } from "@/components/resume/interview-dashboard";
import { listInterviewsForResume } from "@/services/interview.service";
import { getResumeForUser, ResumeServiceError } from "@/services/resume.service";

export const metadata: Metadata = {
  title: "Interview preparation | AI Resume Builder",
};

type PageParams = { params: Promise<{ id: string }> };

export default async function InterviewPreparationPage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let resume;
  let sessions;
  try {
    resume = await getResumeForUser(id, session.user.id);
    sessions = await listInterviewsForResume(id, session.user.id);
  } catch (error) {
    if (error instanceof ResumeServiceError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (!resume) {
    notFound();
  }

  return (
    <main className="flex flex-1 justify-center py-10 sm:py-16">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <BackButton
            href={`/dashboard/resumes/${id}`}
            label="Back to editor"
          />
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Interview preparation
          </h1>
          <p className="text-muted-foreground">
            {resume.title} — practice a mock interview grounded in this
            resume, with optional job description and cover letter context.
          </p>
        </div>
        <InterviewDashboard resumeId={id} initialSessions={sessions} />
      </Container>
    </main>
  );
}
