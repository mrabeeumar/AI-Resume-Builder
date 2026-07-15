import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BriefcaseIcon, ExternalLinkIcon, FileTextIcon, MailIcon } from "lucide-react";

import { auth } from "@/auth";
import { AddInterviewForm } from "@/components/applications/add-interview-form";
import { InterviewList } from "@/components/applications/interview-list";
import { NotesEditor } from "@/components/applications/notes-editor";
import { StatusBadge } from "@/components/applications/status-badge";
import { StatusSelect } from "@/components/applications/status-select";
import { TimelineList } from "@/components/applications/timeline-list";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getJobApplicationForUser,
  JobApplicationServiceError,
  listApplicationTimeline,
} from "@/services/job-application.service";
import { listInterviewsForApplication } from "@/services/job-interview.service";

export const metadata: Metadata = {
  title: "Job workspace | ResoVo",
};

type PageParams = { params: Promise<{ id: string }> };

export default async function JobWorkspacePage({ params }: PageParams) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let application;
  let timeline;
  let interviews;
  try {
    application = await getJobApplicationForUser(id, session.user.id);
    timeline = await listApplicationTimeline(id, session.user.id);
    interviews = await listInterviewsForApplication(id, session.user.id);
  } catch (error) {
    if (error instanceof JobApplicationServiceError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const parsed = application.parsedJobDescription;

  return (
    <main className="flex flex-1 justify-center py-10 sm:py-16">
      <Container className="max-w-5xl flex flex-col gap-8">
        <PageHeader
          icon={BriefcaseIcon}
          title={application.position}
          description={application.company}
          backHref="/dashboard/applications"
          backLabel="Back to applications"
          actions={
            <StatusSelect applicationId={application.id} status={application.status} />
          }
        />

        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="job-description">Job Description</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="gap-4 py-5">
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Company" value={application.company} />
                <Field label="Position" value={application.position} />
                <Field label="Status" value={<StatusBadge status={application.status} />} />
                <Field
                  label="Application date"
                  value={
                    application.applicationDate
                      ? new Date(application.applicationDate).toLocaleDateString()
                      : "—"
                  }
                />
                <Field
                  label="Deadline"
                  value={
                    application.deadline
                      ? new Date(application.deadline).toLocaleDateString()
                      : "—"
                  }
                />
                <Field label="Location" value={application.location ?? "—"} />
                <Field label="Salary" value={application.salary ?? "—"} />
                <Field
                  label="Employment type"
                  value={application.employmentType ?? "—"}
                />
                <Field label="Work mode" value={application.workMode ?? "—"} />
                {application.originalJobUrl && (
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-muted-foreground text-xs font-medium uppercase">
                      Job link
                    </span>
                    <a
                      href={application.originalJobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary flex items-center gap-1 text-sm underline"
                    >
                      {application.originalJobUrl}
                      <ExternalLinkIcon className="size-3.5" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card className="gap-4 py-5">
              <CardHeader>
                <CardTitle className="text-base">Application timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <TimelineList events={timeline} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interviews">
            <div className="flex flex-col gap-4">
              <InterviewList interviews={interviews} resumeId={application.resumeId} />
              <Card className="gap-4 py-5">
                <CardHeader>
                  <CardTitle className="text-base">Add interview round</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddInterviewForm applicationId={application.id} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="gap-4 py-5">
              <CardContent className="flex flex-col gap-3">
                {application.resumeId ? (
                  <Link
                    href={`/dashboard/resumes/${application.resumeId}`}
                    className="hover:bg-accent flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors"
                  >
                    <FileTextIcon className="size-4" />
                    Resume used
                    {application.resumeVersionId && " (tailored version)"}
                  </Link>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No resume linked yet.
                  </p>
                )}
                {application.coverLetterId ? (
                  <Link
                    href={`/dashboard/cover-letters/${application.coverLetterId}`}
                    className="hover:bg-accent flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors"
                  >
                    <MailIcon className="size-4" />
                    Cover letter used
                  </Link>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No cover letter linked yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="job-description">
            <Card className="gap-4 py-5">
              <CardContent className="flex flex-col gap-4">
                {parsed ? (
                  <>
                    <Section title="Responsibilities" items={parsed.responsibilities} />
                    <Section
                      title="Required skills"
                      items={[
                        ...parsed.requiredSkills.technical,
                        ...parsed.requiredSkills.programmingLanguages,
                      ]}
                    />
                    <Section title="Preferred skills" items={parsed.preferredSkills} />
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No parsed job description available for this application.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card className="gap-4 py-5">
              <CardContent>
                <NotesEditor applicationId={application.id} notes={application.notes} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </main>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs font-medium uppercase">
        {label}
      </span>
      <span className="text-foreground text-sm">{value}</span>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      <ul className="text-muted-foreground list-disc pl-5 text-sm">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
