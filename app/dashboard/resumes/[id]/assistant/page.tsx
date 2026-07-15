import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BackButton } from "@/components/layout/back-button";
import { Container } from "@/components/layout/container";
import { AssistantPanel } from "@/components/resume/assistant-panel";
import { listConversationsForResume } from "@/services/chat-history.service";
import { getResumeForUser, ResumeServiceError } from "@/services/resume.service";

export const metadata: Metadata = {
  title: "AI Resume Assistant | ResoVo",
};

type PageParams = { params: Promise<{ id: string }> };

export default async function ResumeAssistantPage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let resume;
  let conversations;
  try {
    resume = await getResumeForUser(id, session.user.id);
    conversations = await listConversationsForResume(id, session.user.id);
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
            AI Resume Assistant
          </h1>
          <p className="text-muted-foreground">
            {resume.title} — ask questions about your resume, your latest
            review, tailoring, and skill gap results, or get career
            guidance.
          </p>
        </div>
        <AssistantPanel resumeId={id} initialConversations={conversations} />
      </Container>
    </main>
  );
}
