import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { BackButton } from "@/components/layout/back-button";
import { Container } from "@/components/layout/container";
import { RestoreVersionButton } from "@/components/resume/restore-version-button";
import { ResumePreview } from "@/components/resume/resume-preview";
import { Card } from "@/components/ui/card";
import type {
  PageSize,
  ResumePageColor,
  ResumeTemplateId,
  ResumeThemeColor,
} from "@/lib/enums";
import { ResumeServiceError } from "@/services/resume.service";
import { getVersionForResume } from "@/services/resume-version.service";
import type { ResumeSectionItem } from "@/types/resume-section";

export const metadata: Metadata = {
  title: "Resume version | AI Resume Builder",
};

type PageParams = { params: Promise<{ id: string; versionId: string }> };

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString();
}

export default async function ResumeVersionPage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id, versionId } = await params;

  let version;
  try {
    version = await getVersionForResume(id, versionId, session.user.id);
  } catch (error) {
    if (error instanceof ResumeServiceError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const { content: snapshot } = version;

  const sections: ResumeSectionItem[] = snapshot.sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({
      id: `${version.id}-${index}`,
      resumeId: version.resumeId,
      type: section.type,
      order: section.order,
      hidden: section.hidden,
      content: section.content,
      createdAt: version.createdAt,
      updatedAt: version.createdAt,
    }));

  return (
    <main className="flex flex-1 justify-center py-8 sm:py-10">
      <Container className="flex max-w-4xl flex-col gap-6">
        <BackButton
          href={`/dashboard/resumes/${id}/versions`}
          label="Back to version history"
        />

        <Card className="flex-row flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <h1 className="text-foreground text-lg font-semibold">
              {version.note || `Version ${version.versionNumber}`}
            </h1>
            <p className="text-muted-foreground text-sm">
              Saved {formatDate(version.createdAt)}
            </p>
          </div>
          <RestoreVersionButton
            resumeId={id}
            versionId={version.id}
            versionLabel={version.note || `Version ${version.versionNumber}`}
          />
        </Card>

        <div className="bg-muted/40 rounded-lg p-3">
          <ResumePreview
            title={snapshot.title}
            sections={sections}
            templateId={(snapshot.templateId ?? "CLASSIC") as ResumeTemplateId}
            themeColor={(snapshot.themeColor ?? "SLATE") as ResumeThemeColor}
            pageColor={(snapshot.pageColor ?? "WHITE") as ResumePageColor}
            pageSize={(snapshot.pageSize ?? "A4") as PageSize}
          />
        </div>
      </Container>
    </main>
  );
}
