import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BackButton } from "@/components/layout/back-button";
import { Container } from "@/components/layout/container";
import { EditorShell } from "@/components/resume/editor/editor-shell";
import { ResumeEditorProvider } from "@/components/resume/editor/resume-editor-provider";
import type {
  PageSize,
  ResumePageColor,
  ResumeTemplateId,
  ResumeThemeColor,
} from "@/lib/enums";
import { ResumeServiceError } from "@/services/resume.service";
import { listSectionsForResume } from "@/services/resume-section.service";
import { getResumeForUser } from "@/services/resume.service";

export const metadata: Metadata = {
  title: "Edit resume | AI Resume Builder",
};

type PageParams = { params: Promise<{ id: string }> };

export default async function ResumeEditorPage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let resume;
  let sections;
  try {
    resume = await getResumeForUser(id, session.user.id);
    sections = resume ? await listSectionsForResume(id, session.user.id) : null;
  } catch (error) {
    if (error instanceof ResumeServiceError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (!resume || !sections) {
    notFound();
  }

  return (
    <main className="flex flex-1 justify-center py-8 sm:py-10">
      <Container className="flex max-w-[96rem] flex-col gap-6">
        <BackButton href="/dashboard/resumes" label="Back to resumes" />
        <ResumeEditorProvider
          resumeId={id}
          title={resume.title}
          initialSections={sections}
          initialTemplateId={resume.templateId as ResumeTemplateId}
          initialThemeColor={resume.themeColor as ResumeThemeColor}
          initialPageColor={resume.pageColor as ResumePageColor}
          initialPageSize={resume.pageSize as PageSize}
        >
          <EditorShell />
        </ResumeEditorProvider>
      </Container>
    </main>
  );
}
