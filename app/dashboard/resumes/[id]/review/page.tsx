import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BackButton } from "@/components/layout/back-button";
import { Container } from "@/components/layout/container";
import { ReviewDashboard } from "@/components/resume/review-dashboard";
import { getResumeForUser, ResumeServiceError } from "@/services/resume.service";
import { listReviewsForResume } from "@/services/resume-review.service";

export const metadata: Metadata = {
  title: "Resume review | ResoVo",
};

type PageParams = { params: Promise<{ id: string }> };

export default async function ResumeReviewPage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let resume;
  let reviews;
  try {
    resume = await getResumeForUser(id, session.user.id);
    reviews = await listReviewsForResume(id, session.user.id);
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
            Resume review
          </h1>
          <p className="text-muted-foreground">
            {resume.title} — get a comprehensive, actionable review of every
            section, plus ATS compatibility, content quality, grammar, and
            prioritized suggestions.
          </p>
        </div>
        <ReviewDashboard resumeId={id} initialReviews={reviews} />
      </Container>
    </main>
  );
}
