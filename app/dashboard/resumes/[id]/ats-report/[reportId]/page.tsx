import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BackButton } from "@/components/layout/back-button";
import { Container } from "@/components/layout/container";
import { AtsReportContent } from "@/components/resume/ats-report-content";
import { getResumeForUser, ResumeServiceError } from "@/services/resume.service";
import { getAtsReportForResume } from "@/services/ats.service";

export const metadata: Metadata = {
  title: "ATS report details | ResoVo",
};

type PageParams = { params: Promise<{ id: string; reportId: string }> };

export default async function AtsReportDetailsPage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id, reportId } = await params;

  let resume;
  let report;
  try {
    resume = await getResumeForUser(id, session.user.id);
    report = await getAtsReportForResume(id, reportId, session.user.id);
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
            href={`/dashboard/resumes/${id}/ats-report`}
            label="Back to report history"
          />
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            ATS report details
          </h1>
          <p className="text-muted-foreground">
            {resume.title} — analyzed on{" "}
            {new Date(report.createdAt).toLocaleString()}.
          </p>
        </div>
        <AtsReportContent report={report.content} />
      </Container>
    </main>
  );
}
