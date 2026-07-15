import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BackButton } from "@/components/layout/back-button";
import { Container } from "@/components/layout/container";
import { CoverLetterVersionHistory } from "@/components/cover-letter/cover-letter-version-history";
import {
  CoverLetterServiceError,
  getCoverLetterForUser,
} from "@/services/cover-letter.service";
import { listVersionsForCoverLetter } from "@/services/cover-letter-version.service";

export const metadata: Metadata = {
  title: "Cover letter version history | ResoVo",
};

type PageParams = { params: Promise<{ id: string }> };

export default async function CoverLetterVersionsPage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let coverLetter;
  let versions;
  try {
    coverLetter = await getCoverLetterForUser(id, session.user.id);
    versions = await listVersionsForCoverLetter(id, session.user.id);
  } catch (error) {
    if (error instanceof CoverLetterServiceError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="flex flex-1 justify-center py-10 sm:py-16">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <BackButton
            href={`/dashboard/cover-letters/${id}`}
            label="Back to editor"
          />
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Version history
          </h1>
          <p className="text-muted-foreground">
            {coverLetter.title} — review, compare, or restore a previous
            version.
          </p>
        </div>
        <CoverLetterVersionHistory
          coverLetterId={id}
          initialVersions={versions}
        />
      </Container>
    </main>
  );
}
