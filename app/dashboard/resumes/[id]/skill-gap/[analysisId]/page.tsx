import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BackButton } from "@/components/layout/back-button";
import { Container } from "@/components/layout/container";
import { SkillGapReportView } from "@/components/resume/skill-gap-report";
import { getResumeForUser, ResumeServiceError } from "@/services/resume.service";
import { getSkillGapAnalysisForResume } from "@/services/skill-gap-analysis.service";

export const metadata: Metadata = {
  title: "Skill gap analysis details | ResoVo",
};

type PageParams = { params: Promise<{ id: string; analysisId: string }> };

export default async function SkillGapAnalysisDetailsPage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id, analysisId } = await params;

  let resume;
  let analysis;
  try {
    resume = await getResumeForUser(id, session.user.id);
    analysis = await getSkillGapAnalysisForResume(id, analysisId, session.user.id);
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
            href={`/dashboard/resumes/${id}/skill-gap`}
            label="Back to skill gap history"
          />
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Skill gap analysis details
          </h1>
          <p className="text-muted-foreground">
            {resume.title}
            {analysis.content.jobTitle ? ` vs. ${analysis.content.jobTitle}` : ""} —
            analyzed on {new Date(analysis.createdAt).toLocaleString()}.
          </p>
        </div>
        <SkillGapReportView report={analysis.content} />
      </Container>
    </main>
  );
}
