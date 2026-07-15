import Link from "next/link";
import { ArrowRightIcon, GlobeIcon, HeartIcon, ZapIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { MarketingHero } from "@/components/layout/marketing-hero";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { Reveal } from "@/components/layout/reveal";
import { SiteFooter } from "@/components/layout/site-footer";

const PERKS = [
  {
    icon: GlobeIcon,
    title: "Remote-first",
    description: "Work from anywhere. We sync across time zones, not desks.",
  },
  {
    icon: ZapIcon,
    title: "Ship fast",
    description: "Small team, short review cycles, real ownership from day one.",
  },
  {
    icon: HeartIcon,
    title: "Mission-driven",
    description: "Every role directly helps someone land a better job.",
  },
];

const OPEN_ROLES = [
  { title: "Senior Full-Stack Engineer", team: "Engineering", location: "Remote" },
  { title: "AI/ML Engineer — Resume Intelligence", team: "Engineering", location: "Remote" },
  { title: "Product Designer", team: "Design", location: "Remote" },
  { title: "Content & Career Coach", team: "Content", location: "Remote" },
];

export default function CareersPage() {
  return (
    <>
      <MarketingNav />

      <main className="flex flex-1 flex-col">
        <MarketingHero
          eyebrow="Careers"
          title={
            <>
              Help job seekers{" "}
              <span className="gradient-text-static">win their next role</span>
            </>
          }
          subtitle="We're a small, remote-first team building the resume tool we wish existed."
        />

        <section className="py-16">
          <Container className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PERKS.map((perk, i) => (
              <Reveal key={perk.title} delay={i * 100}>
                <Card className="hover-glow h-full gap-3 p-6">
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                    <perk.icon className="size-5" />
                  </div>
                  <h3 className="font-heading text-base font-semibold">{perk.title}</h3>
                  <p className="text-muted-foreground text-sm">{perk.description}</p>
                </Card>
              </Reveal>
            ))}
          </Container>
        </section>

        <section className="pb-24">
          <Container className="flex flex-col gap-3 text-center">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">Open roles</h2>
            <p className="text-muted-foreground mx-auto max-w-xl text-pretty">
              Don&apos;t see a fit? Email us at{" "}
              <a href="mailto:careers@resovo.com" className="text-primary font-medium">
                careers@resovo.com
              </a>{" "}
              — we&apos;d still love to hear from you.
            </p>
          </Container>

          <Container className="mt-10 flex flex-col gap-3">
            {OPEN_ROLES.map((role) => (
              <Card
                key={role.title}
                className="hover-glow flex-row items-center justify-between gap-4 p-5"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-heading text-sm font-semibold">{role.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{role.team}</Badge>
                    <span className="text-muted-foreground text-xs">{role.location}</span>
                  </div>
                </div>
                <Link
                  href="mailto:careers@resovo.com"
                  className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap"
                >
                  Apply <ArrowRightIcon className="size-3.5" />
                </Link>
              </Card>
            ))}
          </Container>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
