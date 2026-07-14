import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCardIcon } from "lucide-react";

import { auth } from "@/auth";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { PlanCard } from "@/components/billing/plan-card";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { SubscriptionCard } from "@/components/dashboard/subscription-card";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { getSubscriptionForUser } from "@/services/subscription.service";

export const metadata: Metadata = {
  title: "Billing | AI Resume Builder",
};

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const subscription = await getSubscriptionForUser(session.user.id);

  return (
    <main className="flex flex-1 justify-center py-10 sm:py-16">
      <Container className="flex flex-col gap-8">
        <PageHeader
          icon={CreditCardIcon}
          title="Billing"
          description="Manage your subscription plan and billing details."
          backHref="/dashboard"
          backLabel="Back to dashboard"
        />

        <div className="animate-fade-up stagger-1 flex flex-col gap-4">
          <SubscriptionCard
            plan={subscription.plan}
            status={subscription.status}
            currentPeriodEnd={subscription.currentPeriodEnd}
            cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
          />

          {subscription.plan !== "FREE" ? <ManageBillingButton /> : null}
        </div>

        <div className="animate-fade-up stagger-2 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <PlanCard
            name="Free"
            description="Get started with the essentials."
            features={[
              "Up to 3 resumes",
              "20 AI calls / 30 days",
              "Cover letters",
            ]}
            isCurrent={subscription.plan === "FREE"}
          />
          <PlanCard
            name="Pro"
            description="For active job seekers."
            features={[
              "Unlimited resumes",
              "Unlimited AI calls",
              "Priority support",
            ]}
            isCurrent={subscription.plan === "PRO"}
            action={
              subscription.plan !== "PRO" ? (
                <UpgradeButton plan="PRO" label="Upgrade to Pro" />
              ) : undefined
            }
          />
          <PlanCard
            name="Team"
            description="For teams and career coaches."
            features={[
              "Everything in Pro",
              "Team collaboration",
              "Dedicated support",
            ]}
            isCurrent={subscription.plan === "TEAM"}
            action={
              subscription.plan !== "TEAM" ? (
                <UpgradeButton plan="TEAM" label="Upgrade to Team" />
              ) : undefined
            }
          />
        </div>
      </Container>
    </main>
  );
}
