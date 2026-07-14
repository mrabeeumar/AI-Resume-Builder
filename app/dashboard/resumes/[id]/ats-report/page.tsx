import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BackButton } from "@/components/layout/back-button";
import { Container } from "@/components/layout/container";
import { AtsReportView } from "@/components/resume/ats-report";
import { ResumeServiceError } from "@/services/resume.service";
import { getResumeForUser } from "@/services/resume.service";

export const metadata: Metadata = {
  title: "ATS report | AI Resume Builder",
};

type PageParams = { params: Promise<{ id: string }> };

export default async function AtsReportPage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let resume;
  try {
    resume = await getResumeForUser(id, session.user.id);
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
            ATS report
          </h1>
          <p className="text-muted-foreground">
            {resume.title} — check keyword coverage, skills, readability, and
            missing sections, and get actionable suggestions.
          </p>
        </div>
        <AtsReportView resumeId={id} />
      </Container>
    </main>
  );
}
