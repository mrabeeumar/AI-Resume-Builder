import Link from "next/link";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CheckIcon,
  DownloadIcon,
  MicIcon,
  PencilLineIcon,
  SparkleIcon,
  StarIcon,
  TargetIcon,
  WandSparklesIcon,
  ZapIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { Reveal } from "@/components/layout/reveal";
import { SiteFooter } from "@/components/layout/site-footer";

const ROLE_KEYWORDS = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist",
  "UX Designer",
  "Marketing Lead",
  "Financial Analyst",
  "Nurse Practitioner",
  "Sales Director",
  "DevOps Engineer",
  "Program Manager",
];

const STATS = [
  { value: "3×", label: "more interviews" },
  { value: "12k+", label: "resumes built" },
  { value: "40+", label: "ATS systems passed" },
  { value: "9 min", label: "average build time" },
];

const FEATURES = [
  {
    icon: SparkleIcon,
    title: "AI-written content",
    description:
      "Generate role-specific bullet points from your experience — no blank-page anxiety, ever.",
  },
  {
    icon: TargetIcon,
    title: "ATS-friendly",
    description:
      "Templates and formatting engineered to pass every major applicant-tracking system.",
  },
  {
    icon: WandSparklesIcon,
    title: "Tailored to the job",
    description:
      "Paste a job post and ResoVo rewrites your resume to match what recruiters scan for.",
  },
  {
    icon: DownloadIcon,
    title: "One-click export",
    description:
      "Download a pixel-perfect PDF or editable DOCX in a single click — fonts and spacing intact.",
  },
];

const STEPS = [
  {
    icon: PencilLineIcon,
    number: "1",
    title: "Add your details",
    description:
      "Import your LinkedIn or old resume, or answer a few guided questions to get started.",
  },
  {
    icon: WandSparklesIcon,
    number: "2",
    title: "Let AI enhance it",
    description:
      "AI rewrites weak lines, injects keywords, and scores you against the exact job you want.",
  },
  {
    icon: TargetIcon,
    number: "3",
    title: "Tailor & export",
    description:
      "Paste the job post to get a tailored, scored version, then download a recruiter-ready PDF.",
  },
  {
    icon: BriefcaseIcon,
    number: "4",
    title: "Track & prep",
    description:
      "Log the application, rehearse with an AI interviewer, and walk in ready to close the offer.",
  },
];

const QUOTES = [
  {
    quote:
      "I sent out the same resume for weeks with nothing. Rebuilt it here and had two interviews in the first week.",
    name: "Priya",
    role: "Product Manager",
  },
  {
    quote:
      "The ATS score told me exactly which keywords I was missing. It felt like cheating — in a good way.",
    name: "Marcus",
    role: "Data Analyst",
  },
  {
    quote:
      "Went from a blank page to a polished resume in under ten minutes. The AI rewrites are shockingly good.",
    name: "Elena",
    role: "UX Designer",
  },
];

/** A stylized resume preview used purely as hero decoration. */
function ResumeMock() {
  return (
    <div className="relative w-full max-w-md">
      {/* Floating ATS score chip */}
      <div className="glass animate-float-slow absolute -top-5 -right-4 z-20 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl [animation-delay:-2s]">
        <div className="relative flex size-11 items-center justify-center">
          <svg viewBox="0 0 36 36" className="size-11 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              className="stroke-muted"
              strokeWidth="3.5"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              className="stroke-success"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="97.4"
              strokeDashoffset="4"
            />
          </svg>
          <span className="text-success absolute text-xs font-bold">96</span>
        </div>
        <div className="leading-tight">
          <p className="text-foreground text-sm font-semibold">ATS score</p>
          <p className="text-muted-foreground text-xs">Ready to apply</p>
        </div>
      </div>

      {/* Floating AI chip */}
      <div className="glass animate-float-slow absolute -bottom-4 -left-4 z-20 flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl [animation-delay:-5s]">
        <span className="from-brand-1 to-brand-2 flex size-8 items-center justify-center rounded-lg bg-gradient-to-br text-white">
          <WandSparklesIcon className="size-4" />
        </span>
        <div className="leading-tight">
          <p className="text-foreground text-xs font-semibold">
            Rewrote 8 bullets
          </p>
          <p className="text-muted-foreground text-[11px]">+31% impact score</p>
        </div>
      </div>

      {/* Paper */}
      <div className="rotate-[1.5deg] rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 transition-transform duration-500 hover:rotate-0 sm:p-7">
        <div className="flex items-center gap-4 border-b border-neutral-200 pb-4">
          <div className="from-brand-1 to-brand-2 flex size-12 items-center justify-center rounded-full bg-gradient-to-br text-lg font-bold text-white">
            AM
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-neutral-900">
              Alex Morgan
            </div>
            <div className="text-xs text-neutral-500">
              Senior Product Designer
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div className="text-brand-1 text-[10px] font-bold tracking-widest uppercase">
              Experience
            </div>
            <div className="mt-2 space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-2 w-2/3 rounded-full bg-neutral-800/80" />
                  <div className="h-1.5 w-full rounded-full bg-neutral-200" />
                  <div className="h-1.5 w-11/12 rounded-full bg-neutral-200" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-brand-1 text-[10px] font-bold tracking-widest uppercase">
              Skills
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Figma", "Design Systems", "Research", "Prototyping"].map(
                (s) => (
                  <span
                    key={s}
                    className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600"
                  >
                    {s}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <MarketingNav />

      <main className="flex flex-1 flex-col">
        {/* ---------- Hero ---------- */}
        <section className="bg-brand animate-gradient-pan relative overflow-hidden">
          <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-70" />
          <div className="animate-float-slow pointer-events-none absolute -top-40 -right-24 size-[520px] rounded-full bg-white/15 blur-3xl" />
          <div className="animate-float-slow pointer-events-none absolute -bottom-48 -left-32 size-[440px] rounded-full bg-fuchsia-400/20 blur-3xl [animation-delay:-4s]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

          <Container className="relative grid grid-cols-1 items-center gap-14 py-20 sm:py-28 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <Badge className="animate-fade-up gap-1.5 border border-white/25 bg-white/10 py-1 text-white backdrop-blur-sm">
                <SparkleIcon className="size-3.5" />
                AI-powered resume builder
              </Badge>
              <h1 className="font-heading animate-fade-up stagger-1 mt-5 max-w-2xl text-4xl font-extrabold tracking-tight text-balance text-white sm:text-6xl">
                The resume that gets you{" "}
                <span className="relative whitespace-nowrap">
                  <span className="bg-gradient-to-r from-white via-fuchsia-100 to-white bg-clip-text text-transparent">
                    hired.
                  </span>
                  <svg
                    className="absolute -bottom-1.5 left-0 w-full text-white/60"
                    viewBox="0 0 200 12"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 9C50 3 150 3 198 9"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
              <p className="animate-fade-up stagger-2 mt-5 max-w-xl text-lg text-pretty text-white/85">
                Build an ATS-optimized resume in minutes with AI that writes,
                tailors, and scores every line — then practice the interview
                and track every application from one dashboard.
              </p>
              <div className="animate-fade-up stagger-3 mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Button
                  size="lg"
                  variant="secondary"
                  className="group shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15"
                  asChild
                >
                  <Link href="/register">
                    Build my resume
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-white/10 text-white backdrop-blur-sm hover:border-white/40 hover:bg-white/20 hover:text-white"
                  asChild
                >
                  <Link href="#features">See how it works</Link>
                </Button>
              </div>
              <div className="animate-fade-up stagger-4 mt-8 flex items-center gap-3 text-sm text-white/80">
                <div className="flex -space-x-2">
                  {["from-amber-300 to-orange-400", "from-sky-300 to-blue-400", "from-emerald-300 to-teal-400", "from-fuchsia-300 to-pink-400"].map(
                    (g, i) => (
                      <span
                        key={i}
                        className={`size-7 rounded-full bg-gradient-to-br ring-2 ring-white/30 ${g}`}
                      />
                    ),
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex text-amber-300">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon key={i} className="size-3.5 fill-current" />
                    ))}
                  </span>
                  <span>
                    Loved by <strong className="text-white">12,000+</strong> job
                    seekers
                  </span>
                </div>
              </div>
            </div>

            <div className="animate-scale-in stagger-2 flex justify-center lg:justify-end">
              <ResumeMock />
            </div>
          </Container>
        </section>

        {/* ---------- Role marquee ---------- */}
        <section className="border-b py-8">
          <p className="text-muted-foreground text-center text-xs font-medium tracking-widest uppercase">
            Tuned for the role you&apos;re chasing
          </p>
          <div className="mask-fade-x mt-5 flex overflow-hidden">
            <div className="animate-marquee flex shrink-0 items-center gap-3 pr-3">
              {[...ROLE_KEYWORDS, ...ROLE_KEYWORDS].map((role, i) => (
                <span
                  key={i}
                  className="bg-muted/60 text-muted-foreground flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap"
                >
                  <span className="bg-primary/60 size-1.5 rounded-full" />
                  {role}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Stats ---------- */}
        {/* Numbers use a STATIC gradient clip (not the animated .gradient-text
            utility): background-clip:text does not paint reliably while its
            background-position is animating, which leaves the glyphs invisible. */}
        <section className="py-14">
          <Container>
            <div className="animate-fade-up grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="from-brand-1 to-brand-2 font-heading bg-gradient-to-br bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground mt-1 text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ---------- Features ---------- */}
        <section id="features" className="py-20">
          <Container>
            <Reveal className="flex flex-col items-center gap-3 text-center">
              <span className="text-primary font-mono text-xs font-medium tracking-widest uppercase">
                Why ResoVo
              </span>
              <h2 className="max-w-xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Everything you need to land the interview
              </h2>
              <p className="text-muted-foreground max-w-xl text-pretty">
                One workspace for writing, scoring, and tailoring your resume —
                powered by AI trained on what recruiters actually read.
              </p>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, description }, i) => (
                <Reveal key={title} delay={i * 80}>
                  <Card className="group hover-glow h-full gap-3 p-6 text-left">
                    <div className="from-brand-1 to-brand-2 text-primary-foreground flex size-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold">
                      {title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {description}
                    </p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* ---------- ATS section ---------- */}
        <section className="py-8">
          <Container>
            <Reveal>
              <div className="bg-brand animate-gradient-pan relative grid grid-cols-1 items-center gap-10 overflow-hidden rounded-3xl p-10 sm:p-14 lg:grid-cols-2">
                <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-60" />
                <div className="animate-float-slow pointer-events-none absolute -top-20 -right-10 size-72 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex flex-col gap-4">
                  <span className="w-fit rounded-full bg-white/15 px-3 py-1 font-mono text-xs font-medium tracking-widest text-white uppercase backdrop-blur-sm">
                    ATS optimization
                  </span>
                  <h2 className="font-heading text-3xl font-bold text-balance text-white sm:text-4xl">
                    Beat the bots before you meet the humans
                  </h2>
                  <p className="text-white/80">
                    75% of resumes are rejected by software before a recruiter
                    ever sees them. ResoVo scans yours against the job
                    description and tells you exactly what to fix.
                  </p>
                  <ul className="mt-2 flex flex-col gap-2.5">
                    {[
                      "Keyword match against any job description",
                      "Formatting checks for 40+ tracking systems",
                      "Line-by-line rewrite suggestions",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2.5 text-sm text-white/90"
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                          <CheckIcon className="size-3 text-white" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass relative rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-foreground text-sm font-semibold">
                      Resume scan
                    </span>
                    <Badge variant="success">
                      <span className="bg-success animate-pulse-soft mr-1 size-1.5 rounded-full" />
                      Live
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-col gap-3.5">
                    {[
                      { label: "Keywords", value: 96 },
                      { label: "Formatting", value: 100 },
                      { label: "Impact verbs", value: 82 },
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
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ---------- Beyond the resume ---------- */}
        <section className="py-20">
          <Container>
            <Reveal className="flex flex-col items-center gap-3 text-center">
              <span className="text-primary font-mono text-xs font-medium tracking-widest uppercase">
                Beyond the resume
              </span>
              <h2 className="max-w-xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Your whole job search, in one workspace
              </h2>
              <p className="text-muted-foreground max-w-xl text-pretty">
                ResoVo doesn&apos;t stop at the document — it follows you
                from job post to offer letter.
              </p>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Tailoring */}
              <Reveal delay={0}>
                <Card className="group hover-glow h-full gap-4 p-6 text-left">
                  <div className="from-brand-1 to-brand-2 text-primary-foreground flex size-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <WandSparklesIcon className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold">
                    Tailor to any job
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Paste a job description and get a rewritten resume scored
                    on skills, experience, ATS fit, and keyword coverage.
                  </p>
                  <div className="bg-muted/60 mt-1 flex flex-col gap-3 rounded-xl p-4">
                    {[
                      { label: "Overall match", value: 94 },
                      { label: "ATS score", value: 98 },
                    ].map((row) => (
                      <div key={row.label} className="flex flex-col gap-1.5">
                        <div className="text-muted-foreground flex justify-between text-xs">
                          <span>{row.label}</span>
                          <span className="text-foreground font-semibold">
                            {row.value}%
                          </span>
                        </div>
                        <div className="bg-border/60 h-1.5 overflow-hidden rounded-full">
                          <div
                            className="from-brand-1 to-brand-2 animate-grow-bar h-1.5 rounded-full bg-gradient-to-r"
                            style={{ width: `${row.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Reveal>

              {/* Interview prep */}
              <Reveal delay={100}>
                <Card className="group hover-glow h-full gap-4 p-6 text-left">
                  <div className="from-brand-1 to-brand-2 text-primary-foreground flex size-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <MicIcon className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold">
                    Practice with an AI interviewer
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Mock interviews grounded in your resume and the job post —
                    behavioral, technical, or mixed — with a scored report.
                  </p>
                  <div className="mt-1 flex flex-col gap-2">
                    <div className="bg-muted text-foreground w-fit max-w-[90%] rounded-xl px-3 py-2 text-xs">
                      &quot;Tell me about a time you led a cross-functional
                      launch.&quot;
                    </div>
                    <div className="bg-primary text-primary-foreground ml-auto w-fit max-w-[90%] rounded-xl px-3 py-2 text-xs">
                      &quot;At Orbita, I led the roadmap for...&quot;
                    </div>
                    <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
                      <span>Interview readiness</span>
                      <span className="text-success font-semibold">
                        88/100
                      </span>
                    </div>
                  </div>
                </Card>
              </Reveal>

              {/* Application tracking */}
              <Reveal delay={200}>
                <Card className="group hover-glow h-full gap-4 p-6 text-left">
                  <div className="from-brand-1 to-brand-2 text-primary-foreground flex size-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <BriefcaseIcon className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold">
                    Track every application
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    One workspace for every role — status, interview rounds,
                    and the exact resume version you sent.
                  </p>
                  <div className="mt-1 flex flex-col gap-2">
                    {[
                      {
                        company: "TechCorp",
                        role: "Senior PM",
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
                    ].map((row) => (
                      <div
                        key={row.company}
                        className="bg-muted/60 flex items-center justify-between rounded-lg px-3 py-2 text-xs"
                      >
                        <span className="text-foreground font-medium">
                          {row.company}{" "}
                          <span className="text-muted-foreground font-normal">
                            · {row.role}
                          </span>
                        </span>
                        <Badge variant={row.variant}>{row.status}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </Reveal>
            </div>
          </Container>
        </section>

        {/* ---------- Steps ---------- */}
        <section className="py-20">
          <Container>
            <Reveal className="flex flex-col items-center gap-3 text-center">
              <span className="text-primary font-mono text-xs font-medium tracking-widest uppercase">
                How it works
              </span>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Hired in three steps
              </h2>
            </Reveal>

            <div className="relative mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="from-primary/40 to-primary/40 absolute top-11 right-[12.5%] left-[12.5%] hidden h-px bg-gradient-to-r via-transparent lg:block" />
              {STEPS.map((step, i) => (
                <Reveal key={step.number} delay={i * 120}>
                  <Card className="group hover-lift relative h-full items-center gap-3 p-7 text-center">
                    <div className="relative">
                      <span className="from-brand-1 to-brand-2 text-primary-foreground font-heading flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-105">
                        <step.icon className="size-6" />
                      </span>
                      <span className="border-background bg-foreground text-background absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border-2 text-xs font-bold">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-semibold">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* ---------- Testimonials ---------- */}
        <section className="bg-muted/40 border-y py-20">
          <Container>
            <Reveal className="flex flex-col items-center gap-3 text-center">
              <span className="text-primary font-mono text-xs font-medium tracking-widest uppercase">
                Loved by job seekers
              </span>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Resumes that open doors
              </h2>
            </Reveal>
            <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
              {QUOTES.map((q, i) => (
                <Reveal key={q.name} delay={i * 90}>
                  <Card className="hover-lift h-full gap-4 p-6">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <StarIcon key={s} className="size-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-foreground text-sm leading-relaxed text-pretty">
                      “{q.quote}”
                    </p>
                    <div className="mt-auto flex items-center gap-3 pt-2">
                      <span className="from-brand-1 to-brand-2 flex size-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white">
                        {q.name.charAt(0)}
                      </span>
                      <div className="leading-tight">
                        <div className="text-sm font-semibold">{q.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {q.role}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="py-24">
          <Container>
            <Reveal>
              <div className="bg-brand animate-gradient-pan glow relative overflow-hidden rounded-3xl p-12 text-center sm:p-16">
                <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-60" />
                <div className="animate-float-slow pointer-events-none absolute -top-24 right-0 size-72 rounded-full bg-white/15 blur-3xl" />
                <div className="animate-float-slow pointer-events-none absolute -bottom-24 left-0 size-72 rounded-full bg-fuchsia-400/20 blur-3xl [animation-delay:-3s]" />
                <div className="relative">
                  <div className="mb-5 flex justify-center">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                      <ZapIcon className="size-7 text-white" />
                    </span>
                  </div>
                  <h2 className="font-heading text-3xl font-bold text-balance text-white sm:text-4xl">
                    Your next role starts with a better resume
                  </h2>
                  <p className="mt-3 text-white/85">
                    Free to start. No credit card. Ready in minutes.
                  </p>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="group mt-8"
                    asChild
                  >
                    <Link href="/register">
                      Build my resume free
                      <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ---------- Footer ---------- */}
        <SiteFooter />
      </main>
    </>
  );
}
