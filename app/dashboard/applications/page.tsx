import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BriefcaseIcon } from "lucide-react";

import { auth } from "@/auth";
import { ApplicationList } from "@/components/applications/application-list";
import { CreateApplicationForm } from "@/components/applications/create-application-form";
import { ImportApplicationForm } from "@/components/applications/import-application-form";
import { SearchFilterBar } from "@/components/applications/search-filter-bar";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JobApplicationStatus } from "@/lib/enums";
import { listJobApplicationsForUser } from "@/services/job-application.service";

export const metadata: Metadata = {
  title: "Applications | ResoVo",
};

type PageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
};

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { search, status, page } = await searchParams;

  const result = await listJobApplicationsForUser(session.user.id, {
    search,
    status: status as JobApplicationStatus | undefined,
    page: page ? Number(page) : undefined,
  } as never);

  return (
    <main className="flex flex-1 justify-center py-10 sm:py-16">
      <Container className="max-w-6xl flex flex-col gap-8">
        <PageHeader
          icon={BriefcaseIcon}
          title="Job applications"
          description="Track every application, interview round, and document in one workspace."
          backHref="/dashboard"
          backLabel="Back to dashboard"
        />

        <Card className="animate-fade-up stagger-1 gap-4 py-5">
          <CardHeader>
            <CardTitle className="text-base">Start a new application</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="import">
              <TabsList>
                <TabsTrigger value="import">Import from URL</TabsTrigger>
                <TabsTrigger value="manual">Create manually</TabsTrigger>
              </TabsList>
              <TabsContent value="import">
                <ImportApplicationForm />
              </TabsContent>
              <TabsContent value="manual">
                <CreateApplicationForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="animate-fade-up stagger-2 flex flex-col gap-4">
          <SearchFilterBar />
          <ApplicationList applications={result.applications} />
        </div>
      </Container>
    </main>
  );
}
