"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PRICES = {
  monthly: { PRO: 15, TEAM: 29 },
  yearly: { PRO: 12, TEAM: 23 },
} as const;

function PricingTiers() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const yearly = billing === "yearly";

  return (
    <>
      <div className="bg-card animate-fade-up stagger-3 mx-auto mt-2 inline-flex items-center gap-1 rounded-full border p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setBilling("monthly")}
          className={cn(
            "cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 active:scale-95",
            !yearly
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground",
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBilling("yearly")}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 active:scale-95",
            yearly
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground",
          )}
        >
          Yearly
          <Badge variant="success">−20%</Badge>
        </button>
      </div>

      <div className="animate-fade-up stagger-4 mt-12 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
        <Card className="hover-glow gap-6 p-8">
          <div>
            <span className="font-heading text-lg font-semibold">Free</span>
            <p className="text-muted-foreground mt-1 text-sm">
              Get started with the essentials
            </p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-4xl font-extrabold">$0</span>
            <span className="text-muted-foreground text-sm">forever</span>
          </div>
          <Button variant="outline" asChild>
            <Link href="/register">Start free</Link>
          </Button>
          <ul className="flex flex-col gap-3 text-sm">
            {[
              { label: "Up to 3 resumes", ok: true },
              { label: "20 AI calls / 30 days", ok: true },
              { label: "Cover letters", ok: true },
              { label: "ATS keyword matching", ok: false },
              { label: "Team collaboration", ok: false },
            ].map((f) => (
              <li key={f.label} className="flex items-center gap-2.5">
                {f.ok ? (
                  <CheckIcon className="text-success size-4 shrink-0" />
                ) : (
                  <XIcon className="text-muted-foreground/50 size-4 shrink-0" />
                )}
                <span className={f.ok ? "" : "text-muted-foreground"}>
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="bg-brand animate-gradient-pan glow relative gap-6 border-transparent p-8 text-white transition-transform duration-300 lg:scale-[1.04] hover:-translate-y-1">
          <div className="bg-grid-light pointer-events-none absolute inset-0 rounded-[inherit] opacity-50" />
          <Badge className="text-primary absolute -top-3 left-1/2 z-10 -translate-x-1/2 bg-white shadow-md">
            ★ Most popular
          </Badge>
          <div className="relative z-10 flex flex-col gap-6">
            <div>
              <span className="font-heading text-lg font-semibold">Pro</span>
              <p className="mt-1 text-sm text-white/60">
                For the active job search
              </p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-4xl font-extrabold">
                ${PRICES[billing].PRO}
              </span>
              <span className="text-sm text-white/60">/ month</span>
            </div>
            <span className="-mt-4 text-xs text-white/50">
              {yearly
                ? `Billed $${PRICES.yearly.PRO * 12} yearly — save $${(PRICES.monthly.PRO - PRICES.yearly.PRO) * 12}`
                : "Billed monthly"}
            </span>
            <Button variant="secondary" asChild>
              <Link href="/register">Start 7-day trial</Link>
            </Button>
            <ul className="flex flex-col gap-3 text-sm">
              {[
                "Unlimited resumes",
                "Unlimited AI calls",
                "All templates",
                "ATS keyword matching",
                "Unlimited cover letters",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <CheckIcon className="size-3 text-white" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="hover-glow gap-6 p-8">
          <div>
            <span className="font-heading text-lg font-semibold">Team</span>
            <p className="text-muted-foreground mt-1 text-sm">
              For teams and career coaches
            </p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-4xl font-extrabold">
              ${PRICES[billing].TEAM}
            </span>
            <span className="text-muted-foreground text-sm">/ seat / mo</span>
          </div>
          <Button variant="outline" asChild>
            <Link href="/register">Talk to sales</Link>
          </Button>
          <ul className="flex flex-col gap-3 text-sm">
            {[
              "Everything in Pro",
              "Team collaboration",
              "Shared template library",
              "Usage analytics",
              "Dedicated support",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <CheckIcon className="text-success size-4 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

export { PricingTiers };
