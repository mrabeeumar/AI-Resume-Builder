import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BackButton } from "@/components/layout/back-button";
import { Container } from "@/components/layout/container";
import { SkillGapDashboard } from "@/components/resume/skill-gap-dashboard";
import { getResumeForUser, ResumeServiceError } from "@/services/resume.service";
import { listSkillGapAnalysesForResume } from "@/services/skill-gap-analysis.service";

export const metadata: Metadata = {
  title: "Skill gap analysis | ResoVo",
};

type PageParams = { params: Promise<{ id: string }> };

export default async function SkillGapAnalysisPage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let resume;
  let analyses;
  try {
    resume = await getResumeForUser(id, session.user.id);
    analyses = await listSkillGapAnalysesForResume(id, session.user.id);
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
            Skill gap analysis
          </h1>
          <p className="text-muted-foreground">
            {resume.title} — compare this resume against a target job
            description to see missing skills, match scores, strengths, and
            a personalized learning roadmap.
          </p>
        </div>
        <SkillGapDashboard resumeId={id} initialAnalyses={analyses} />
      </Container>
    </main>
  );
}
