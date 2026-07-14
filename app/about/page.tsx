import Link from "next/link";
import { HeartIcon, RocketIcon, TargetIcon, UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { MarketingHero } from "@/components/layout/marketing-hero";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { Reveal } from "@/components/layout/reveal";
import { SiteFooter } from "@/components/layout/site-footer";

const VALUES = [
  {
    icon: TargetIcon,
    title: "Accuracy over hype",
    description:
      "We never invent skills or experience. Every AI suggestion is grounded in what you've actually done.",
  },
  {
    icon: RocketIcon,
    title: "Speed that respects craft",
    description:
      "A great resume in minutes, not hours — without feeling like a template everyone else is using.",
  },
  {
    icon: UsersIcon,
    title: "Built with job seekers",
    description:
      "Every feature traces back to a real frustration a real candidate told us about.",
  },
];

const STATS = [
  { value: "1M+", label: "resumes parsed" },
  { value: "180K+", label: "job seekers helped" },
  { value: "4.8/5", label: "average rating" },
];

export default function AboutPage() {
  return (
    <>
      <MarketingNav />

      <main className="flex flex-1 flex-col">
        <MarketingHero
          eyebrow="About us"
          title={
            <>
              We&apos;re building the resume tool{" "}
              <span className="gradient-text-static">we wished existed</span>
            </>
          }
          subtitle="Resumely started as a side project to fix our own job search. It's now the AI resume builder trusted by hundreds of thousands of candidates."
        />

        <section className="py-16">
          <Container className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {STATS.map((stat) => (
              <Card key={stat.label} className="items-center gap-1 py-8 text-center">
                <span className="font-heading text-3xl font-bold">{stat.value}</span>
                <span className="text-muted-foreground text-sm">{stat.label}</span>
              </Card>
            ))}
          </Container>
        </section>

        <section className="pb-16">
          <Container className="flex flex-col gap-3 text-center">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">What we stand for</h2>
            <p className="text-muted-foreground mx-auto max-w-xl text-pretty">
              Three principles guide every decision we make, from the AI prompts we write to the
              features we ship.
            </p>
          </Container>
          <Container className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {VALUES.map((value, i) => (
              <Reveal key={value.title} delay={i * 100}>
                <Card className="hover-glow h-full gap-3 p-6">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                    <value.icon className="size-5" />
                  </div>
                  <h3 className="font-heading text-base font-semibold">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </Card>
              </Reveal>
            ))}
          </Container>
        </section>

        <section className="pb-24">
          <Container>
            <div className="bg-brand animate-gradient-pan glow relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl p-10 text-center text-white sm:p-14">
              <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-50" />
              <HeartIcon className="relative size-8" />
              <h2 className="font-heading relative text-2xl font-bold sm:text-3xl">
                We&apos;re hiring people who care about this mission
              </h2>
              <p className="relative max-w-md text-white/80">
                Join a small team obsessed with helping people land the job they actually want.
              </p>
              <Button asChild variant="secondary" className="relative">
                <Link href="/careers">View open roles</Link>
              </Button>
            </div>
          </Container>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
