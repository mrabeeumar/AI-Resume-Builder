import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MailIcon } from "lucide-react";

import { auth } from "@/auth";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { CoverLetterList } from "@/components/cover-letter/cover-letter-list";
import { CreateCoverLetterForm } from "@/components/cover-letter/create-cover-letter-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCoverLettersForUser } from "@/services/cover-letter.service";

export const metadata: Metadata = {
  title: "Cover letters | ResoVo",
};

export default async function CoverLettersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const coverLetters = await listCoverLettersForUser(session.user.id);

  return (
    <main className="flex flex-1 justify-center py-10 sm:py-16">
      <Container className="max-w-6xl flex flex-col gap-8">
        <PageHeader
          icon={MailIcon}
          title="Your cover letters"
          description="Create, generate, rewrite, and customize cover letters for specific job descriptions."
          backHref="/dashboard"
          backLabel="Back to dashboard"
        />

        <Card className="animate-fade-up stagger-1 gap-4 py-5">
          <CardHeader>
            <CardTitle className="text-base">Start a new cover letter</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateCoverLetterForm />
          </CardContent>
        </Card>

        <div className="animate-fade-up stagger-2">
          <CoverLetterList coverLetters={coverLetters} />
        </div>
      </Container>
    </main>
  );
}
