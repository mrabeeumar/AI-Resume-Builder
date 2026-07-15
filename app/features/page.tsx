import Link from "next/link";
import {
  BriefcaseIcon,
  CheckIcon,
  DownloadIcon,
  MailIcon,
  MicIcon,
  PaletteIcon,
  SparkleIcon,
  TargetIcon,
  UsersIcon,
  WandSparklesIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { MarketingHero } from "@/components/layout/marketing-hero";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { Reveal } from "@/components/layout/reveal";
import { SiteFooter } from "@/components/layout/site-footer";

const MORE_FEATURES = [
  {
    icon: MailIcon,
    badge: "Pro",
    title: "Cover letter generation",
    description:
      "A tailored cover letter for every application, written from your resume and the job post — in your voice, not a template's.",
  },
  {
    icon: TargetIcon,
    badge: null,
    title: "Resume scoring",
    description:
      "A 0–100 score across content, formatting, keywords, and impact — with a prioritized fix list to climb it.",
  },
  {
    icon: PaletteIcon,
    badge: null,
    title: "Deep customization",
    description:
      "Reorder sections by drag, tune fonts, spacing, and accent colors — the layout engine keeps everything ATS-safe.",
  },
  {
    icon: DownloadIcon,
    badge: null,
    title: "Export anywhere",
    description:
      "Pixel-perfect PDF, editable DOCX, or a live web link that always shows your latest version.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <MarketingNav active="/features" />

      <main className="flex flex-1 flex-col">
        <MarketingHero
          eyebrow="Features"
          title={
            <>
              A complete toolkit for the{" "}
              <span className="gradient-text-static">modern job search</span>
            </>
          }
          subtitle="From first draft to final offer — every feature is built to move you one step closer to hired."
        />

        {/* AI generation */}
        <section className="py-16 sm:py-20">
          <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <Reveal className="flex flex-col gap-4">
              <div className="from-brand-1 to-brand-2 text-primary-foreground flex size-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg shadow-primary/25">
                <SparkleIcon className="size-5" />
              </div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                AI-powered resume generation
              </h2>
              <p className="text-muted-foreground">
                Describe your experience in plain language — the AI turns it
                into sharp, recruiter-ready bullet points with strong action
                verbs and quantified results.
              </p>
              <ul className="mt-2 flex flex-col gap-2.5">
                {[
                  "Tone control: confident, concise, or executive",
                  "Rewrites tailored to any pasted job description",
                  "One-click accept, edit, or regenerate",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <span className="bg-primary/10 flex size-5 shrink-0 items-center justify-center rounded-full">
                      <CheckIcon className="text-primary size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={120}>
              <Card className="gap-3 border-none bg-neutral-900 p-8 text-white shadow-xl dark:ring-1 dark:ring-white/10">
                <span className="font-mono text-[10px] tracking-widest text-white/50 uppercase">
                  Before
                </span>
                <p className="rounded-lg bg-white/5 p-4 text-sm text-white/60 ring-1 ring-white/10">
                  &quot;Responsible for managing social media accounts.&quot;
                </p>
                <div className="my-1 flex items-center gap-2 text-xs text-white/50">
                  <SparkleIcon className="size-3.5" /> AI rewrite
                  <div className="h-px flex-1 bg-white/10" />↓
                </div>
                <span className="font-mono text-[10px] tracking-widest text-teal-300 uppercase">
                  After
                </span>
                <p className="rounded-lg bg-teal-400/10 p-4 text-sm text-white ring-1 ring-teal-400/25">
                  &quot;Grew engaged social audience{" "}
                  <b className="text-teal-300">42% YoY</b> across 4 channels by
                  launching a data-driven content calendar.&quot;
                </p>
                <div className="mt-1 flex gap-2">
                  <Button size="sm">Accept</Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    Regenerate
                  </Button>
                </div>
              </Card>
            </Reveal>
          </Container>
        </section>

        {/* ATS */}
        <section className="bg-muted/50 border-y py-16 sm:py-20">
          <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <Reveal className="order-2 lg:order-1">
              <Card className="gap-4 p-7 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold">
                    Match report
                  </span>
                  <Badge variant="secondary">Senior PM · Orbita</Badge>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "roadmap ownership", ok: true },
                    { label: "stakeholder management", ok: true },
                    { label: "A/B experimentation", ok: false },
                    { label: "SQL fluency", ok: false },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className={
                        row.ok
                          ? "bg-success/10 ring-success/20 flex items-center justify-between rounded-lg px-4 py-3 text-sm ring-1"
                          : "bg-warning/10 ring-warning/30 flex items-center justify-between rounded-lg px-4 py-3 text-sm ring-1"
                      }
                    >
                      <span>{row.label}</span>
                      <span
                        className={
                          row.ok
                            ? "text-success text-xs font-semibold"
                            : "text-warning text-xs font-semibold"
                        }
                      >
                        {row.ok ? "✓ found" : "+ add this"}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>
            <Reveal delay={120} className="order-1 lg:order-2">
              <div className="flex flex-col gap-4">
                <div className="bg-success/15 text-success flex size-12 items-center justify-center rounded-xl">
                  <TargetIcon className="size-5" />
                </div>
                <h2 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                  ATS optimization &amp; keyword matching
                </h2>
                <p className="text-muted-foreground">
                  Paste any job description and see exactly which keywords
                  you&apos;re missing, which sections parsers struggle with, and
                  how to fix both — in real time.
                </p>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Tailoring */}
        <section className="py-16 sm:py-20">
          <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <Reveal className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="from-brand-1 to-brand-2 text-primary-foreground flex size-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg shadow-primary/25">
                  <WandSparklesIcon className="size-5" />
                </div>
                <Badge>New</Badge>
              </div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                Tailor your resume to any job in seconds
              </h2>
              <p className="text-muted-foreground">
                Paste or upload a job description and the AI rewrites your
                summary, reorders your skills, and scores the match — so
                every application feels custom-written for that recruiter.
              </p>
              <ul className="mt-2 flex flex-col gap-2.5">
                {[
                  "Scored on skills, experience, ATS fit, and keywords",
                  "Every tailor saves as a new resume version — nothing is overwritten",
                  "Turn a tailored resume straight into a tracked application",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <span className="bg-primary/10 flex size-5 shrink-0 items-center justify-center rounded-full">
                      <CheckIcon className="text-primary size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={120}>
              <Card className="gap-4 p-7 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold">
                    Tailored match
                  </span>
                  <Badge variant="success">91% confidence</Badge>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Overall match", value: 94 },
                    { label: "Skill match", value: 88 },
                    { label: "Experience match", value: 90 },
                    { label: "ATS score", value: 97 },
                    { label: "Keyword coverage", value: 85 },
                  ].map((row) => (
                    <div key={row.label} className="flex flex-col gap-1.5">
                      <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{row.label}</span>
                        <span className="text-foreground font-semibold">
                          {row.value}%
                        </span>
                      </div>
                      <div className="bg-muted h-2 overflow-hidden rounded-full">
                        <div
                          className="from-brand-1 to-brand-2 animate-grow-bar h-2 rounded-full bg-gradient-to-r"
                          style={{ width: `${row.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    "Roadmap ownership",
                    "Stakeholder management",
                    "SQL",
                    "A/B experimentation",
                  ].map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            </Reveal>
          </Container>
        </section>

        {/* Interview preparation */}
        <section className="bg-muted/50 border-y py-16 sm:py-20">
          <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <Reveal className="order-2 lg:order-1">
              <Card className="gap-4 p-7 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold">
                    Mock interview
                  </span>
                  <Badge variant="secondary">Behavioral</Badge>
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="bg-background text-foreground w-fit max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm">
                    Tell me about a time you led a cross-functional launch.
                  </div>
                  <div className="bg-primary text-primary-foreground ml-auto w-fit max-w-[85%] rounded-xl px-3 py-2 text-sm">
                    At Orbita, I led the roadmap for our checkout redesign
                    across design, eng, and support...
                  </div>
                  <div className="bg-background rounded-lg p-3 text-sm shadow-sm">
                    <span className="font-medium">Score: </span>
                    <span className="text-success font-semibold">88/100</span>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Strong structure — quantify the impact next time.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Resume", "Technical", "HR", "Mixed"].map((type) => (
                    <Badge key={type} variant="outline">
                      {type}
                    </Badge>
                  ))}
                </div>
              </Card>
            </Reveal>
            <Reveal delay={120} className="order-1 lg:order-2">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-success/15 text-success flex size-12 items-center justify-center rounded-xl">
                    <MicIcon className="size-5" />
                  </div>
                  <Badge>New</Badge>
                </div>
                <h2 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                  Walk into the interview already warmed up
                </h2>
                <p className="text-muted-foreground">
                  Practice resume, technical, HR, behavioral, or mixed mock
                  interviews grounded in your actual resume and the job
                  description. The AI asks personalized questions, evaluates
                  each answer, and hands you a full report at the end.
                </p>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* Application tracking */}
        <section className="py-16 sm:py-20">
          <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <Reveal className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="from-brand-1 to-brand-2 text-primary-foreground flex size-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg shadow-primary/25">
                  <BriefcaseIcon className="size-5" />
                </div>
                <Badge>New</Badge>
              </div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                Every application, tracked in one workspace
              </h2>
              <p className="text-muted-foreground">
                Import a job posting or create an application by hand, and
                ResoVo keeps the status, resume version, and interview
                history together — so nothing falls through the cracks.
              </p>
              <ul className="mt-2 flex flex-col gap-2.5">
                {[
                  "Saved, applied, interviewing, offer, or closed — at a glance",
                  "Every application links back to the exact resume you sent",
                  "Create a workspace straight from a tailoring session",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <span className="bg-primary/10 flex size-5 shrink-0 items-center justify-center rounded-full">
                      <CheckIcon className="text-primary size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={120}>
              <Card className="gap-3 p-7 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-semibold">
                    Job workspace
                  </span>
                  <Badge variant="secondary">4 active</Badge>
                </div>
                <div className="flex flex-col gap-2.5">
                  {[
                    {
                      company: "TechCorp",
                      role: "Senior Product Manager",
                      status: "Interview scheduled",
                      variant: "info" as const,
                    },
                    {
                      company: "Northwind",
                      role: "Product Analyst",
                      status: "Offer received",
                      variant: "success" as const,
                    },
                    {
                      company: "Vertex Labs",
                      role: "Growth PM",
                      status: "Applied",
                      variant: "secondary" as const,
                    },
                    {
                      company: "Halcyon",
                      role: "Platform PM",
                      status: "Assessment",
                      variant: "warning" as const,
                    },
                  ].map((row) => (
                    <div
                      key={row.company}
                      className="bg-muted/60 flex items-center justify-between rounded-lg px-4 py-3 text-sm"
                    >
                      <span>
                        <span className="text-foreground font-medium">
                          {row.company}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          · {row.role}
                        </span>
                      </span>
                      <Badge variant={row.variant}>{row.status}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>
          </Container>
        </section>

        {/* Grid of 4 more features */}
        <section className="py-16 sm:py-20">
          <Container className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {MORE_FEATURES.map(({ icon: Icon, badge, title, description }, i) => (
              <Reveal key={title} delay={(i % 2) * 100}>
                <Card className="group hover-glow h-full gap-3 p-7">
                  <div className="flex items-start justify-between">
                    <div className="from-brand-1 to-brand-2 text-primary-foreground flex size-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                      <Icon className="size-5" />
                    </div>
                    {badge && <Badge>{badge}</Badge>}
                  </div>
                  <h3 className="font-heading text-lg font-semibold">{title}</h3>
                  <p className="text-muted-foreground text-sm">{description}</p>
                </Card>
              </Reveal>
            ))}
          </Container>
        </section>

        {/* Collaboration */}
        <section className="pb-16 sm:pb-20">
          <Container>
            <Reveal>
              <div className="bg-brand animate-gradient-pan glow relative grid grid-cols-1 items-center gap-10 overflow-hidden rounded-3xl p-10 text-white sm:p-14 lg:grid-cols-2">
                <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-50" />
                <div className="relative flex flex-col gap-3">
                  <span className="w-fit rounded-full bg-white/15 px-3 py-1 font-mono text-xs tracking-widest text-white uppercase backdrop-blur-sm">
                    Collaboration
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-balance sm:text-3xl">
                    Get feedback from mentors and coaches
                  </h2>
                  <p className="text-white/80">
                    Share a review link — comments land directly on the line
                    they&apos;re about. Perfect for career coaches, university
                    career centers, and recruiting teams.
                  </p>
                  <Button variant="secondary" className="mt-3 w-fit" asChild>
                    <Link href="/register">Try collaboration →</Link>
                  </Button>
                </div>
                <div className="glass relative rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <span className="from-warning to-primary font-heading flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white">
                      MC
                    </span>
                    <div>
                      <span className="text-foreground text-sm font-semibold">
                        Maya (Coach)
                      </span>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Lead with the revenue number here — it&apos;s your
                        strongest proof point.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* CTA */}
        <section className="pb-24 text-center">
          <Container className="flex flex-col items-center gap-3">
            <span className="from-brand-1 to-brand-2 text-primary-foreground flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg shadow-primary/30">
              <UsersIcon className="size-7" />
            </span>
            <h2 className="font-heading mt-1 text-2xl font-bold sm:text-3xl">
              Ready to try every feature?
            </h2>
            <Button size="lg" className="mt-3" asChild>
              <Link href="/register">Get started free →</Link>
            </Button>
          </Container>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
