import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BackButton } from "@/components/layout/back-button";
import { Container } from "@/components/layout/container";
import { CoverLetterEditor } from "@/components/cover-letter/cover-letter-editor";
import type { PageSize, ResumePageColor } from "@/lib/enums";
import {
  CoverLetterServiceError,
  getCoverLetterForUser,
} from "@/services/cover-letter.service";

export const metadata: Metadata = {
  title: "Edit cover letter | AI Resume Builder",
};

type PageParams = { params: Promise<{ id: string }> };

export default async function CoverLetterEditorPage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let coverLetter;
  try {
    coverLetter = await getCoverLetterForUser(id, session.user.id);
  } catch (error) {
    if (error instanceof CoverLetterServiceError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="flex flex-1 justify-center py-8 sm:py-10">
      <Container className="flex max-w-6xl flex-col gap-6">
        <BackButton
          href="/dashboard/cover-letters"
          label="Back to cover letters"
        />
        <CoverLetterEditor
          coverLetterId={id}
          title={coverLetter.title}
          initialContent={coverLetter.content}
          initialPageColor={coverLetter.pageColor as ResumePageColor}
          initialPageSize={coverLetter.pageSize as PageSize}
        />
      </Container>
    </main>
  );
}
