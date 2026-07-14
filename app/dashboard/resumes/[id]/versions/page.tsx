import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BackButton } from "@/components/layout/back-button";
import { Container } from "@/components/layout/container";
import { VersionHistory } from "@/components/resume/version-history";
import {
  getResumeForUser,
  ResumeServiceError,
} from "@/services/resume.service";
import { listVersionsForResume } from "@/services/resume-version.service";

export const metadata: Metadata = {
  title: "Version history | AI Resume Builder",
};

type PageParams = { params: Promise<{ id: string }> };

export default async function ResumeVersionsPage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let resume;
  let versions;
  try {
    resume = await getResumeForUser(id, session.user.id);
    versions = resume ? await listVersionsForResume(id, session.user.id) : null;
  } catch (error) {
    if (error instanceof ResumeServiceError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (!resume || !versions) {
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
            Version history
          </h1>
          <p className="text-muted-foreground">
            {resume.title} — review, compare, or restore a previous version.
          </p>
        </div>
        <VersionHistory resumeId={id} initialVersions={versions} />
      </Container>
    </main>
  );
}
