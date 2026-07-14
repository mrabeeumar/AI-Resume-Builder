import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BackButton } from "@/components/layout/back-button";
import { Container } from "@/components/layout/container";
import { ReviewReportView } from "@/components/resume/review-report";
import { getResumeForUser, ResumeServiceError } from "@/services/resume.service";
import { getReviewForResume } from "@/services/resume-review.service";

export const metadata: Metadata = {
  title: "Review details | AI Resume Builder",
};

type PageParams = { params: Promise<{ id: string; reviewId: string }> };

export default async function ReviewDetailsPage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id, reviewId } = await params;

  let resume;
  let review;
  try {
    resume = await getResumeForUser(id, session.user.id);
    review = await getReviewForResume(id, reviewId, session.user.id);
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
            href={`/dashboard/resumes/${id}/review`}
            label="Back to review history"
          />
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Review details
          </h1>
          <p className="text-muted-foreground">
            {resume.title} — reviewed on{" "}
            {new Date(review.createdAt).toLocaleString()}.
          </p>
        </div>
        <ReviewReportView report={review.content} />
      </Container>
    </main>
  );
}
