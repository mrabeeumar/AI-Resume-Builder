import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileTextIcon } from "lucide-react";

import { auth } from "@/auth";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { CreateResumeForm } from "@/components/resume/create-resume-form";
import { ImportResumeForm } from "@/components/resume/import-resume-form";
import { ResumeList } from "@/components/resume/resume-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listResumesForUser } from "@/services/resume.service";

export const metadata: Metadata = {
  title: "Resumes | ResoVo",
};

export default async function ResumesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const resumes = await listResumesForUser(session.user.id);

  return (
    <main className="flex flex-1 justify-center py-10 sm:py-16">
      <Container className="max-w-6xl flex flex-col gap-8">
        <PageHeader
          icon={FileTextIcon}
          title="Your resumes"
          description="Create, rename, duplicate, or delete your resumes."
          backHref="/dashboard"
          backLabel="Back to dashboard"
        />

        <Card className="animate-fade-up stagger-1 gap-4 py-5">
          <CardHeader>
            <CardTitle className="text-base">Start a new resume</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CreateResumeForm />
            <ImportResumeForm />
          </CardContent>
        </Card>

        <div className="animate-fade-up stagger-2">
          <ResumeList resumes={resumes} />
        </div>
      </Container>
    </main>
  );
}
