import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BriefcaseIcon,
  FileTextIcon,
  MailIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";

import { auth } from "@/auth";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AIUsageCard } from "@/components/dashboard/ai-usage-card";
import { ApplicationsOverviewCard } from "@/components/dashboard/applications-overview-card";
import { RecentApplicationsCard } from "@/components/dashboard/recent-applications-card";
import { RecentResumesCard } from "@/components/dashboard/recent-resumes-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { SubscriptionCard } from "@/components/dashboard/subscription-card";
import { UpcomingInterviewsCard } from "@/components/dashboard/upcoming-interviews-card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { getDashboardData } from "@/services/dashboard.service";
import { getJobApplicationsDashboardData } from "@/services/job-application.service";

export const metadata: Metadata = {
  title: "Dashboard | AI Resume Builder",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dashboard = await getDashboardData(session.user.id);
  const applicationsDashboard = await getJobApplicationsDashboardData(
    session.user.id,
  );

  return (
    <main className="flex flex-1 justify-center py-10 sm:py-16">
      <Container className="max-w-6xl flex flex-col gap-8">
        <div className="from-primary/[0.08] via-card to-card animate-fade-up relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 sm:p-8">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="bg-primary/10 animate-float-slow pointer-events-none absolute -top-16 -right-10 size-56 rounded-full blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-sm font-medium">
                Welcome back
              </span>
              <h1 className="text-foreground font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                {session.user.name ? (
                  <>
                    Hey,{" "}
                    <span className="gradient-text-static">
                      {session.user.name}
                    </span>
                  </>
                ) : (
                  "Your workspace"
                )}
              </h1>
              <p className="text-muted-foreground text-sm">
                {session.user.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard/resumes">
                  <PlusIcon className="size-4" />
                  New resume
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/cover-letters">
                  <MailIcon className="size-4" />
                  New cover letter
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="animate-fade-up stagger-1 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Resumes"
            value={dashboard.resumeCount}
            icon={FileTextIcon}
            tone="blue"
          />
          <StatCard
            label="Cover letters"
            value={dashboard.coverLetterCount}
            icon={MailIcon}
            tone="violet"
          />
          <StatCard
            label="AI calls (30d)"
            value={dashboard.aiUsage.totalCalls}
            description={`${dashboard.aiUsage.totalTokens.toLocaleString()} tokens`}
            icon={SparklesIcon}
            tone="amber"
          />
        </div>

        <div className="animate-fade-up stagger-2 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-foreground font-heading text-lg font-semibold">
              Job applications
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/applications">
                <BriefcaseIcon className="size-4" />
                Open workspace
              </Link>
            </Button>
          </div>
          <ApplicationsOverviewCard overview={applicationsDashboard.overview} />
        </div>

        <div className="animate-fade-up stagger-3 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <RecentResumesCard resumes={dashboard.recentResumes} />
            <RecentApplicationsCard
              applications={applicationsDashboard.recentApplications}
            />
            <ActivityFeed items={dashboard.activity} />
          </div>
          <div className="flex flex-col gap-6">
            <UpcomingInterviewsCard
              interviews={applicationsDashboard.upcomingInterviews}
            />
            <SubscriptionCard
              plan={dashboard.subscription.plan}
              status={dashboard.subscription.status}
              currentPeriodEnd={dashboard.subscription.currentPeriodEnd}
              cancelAtPeriodEnd={dashboard.subscription.cancelAtPeriodEnd}
            />
            <AIUsageCard
              totalCalls={dashboard.aiUsage.totalCalls}
              totalTokens={dashboard.aiUsage.totalTokens}
              windowDays={dashboard.aiUsage.windowDays}
              byFeature={dashboard.aiUsage.byFeature}
            />
          </div>
        </div>
      </Container>
    </main>
  );
}
