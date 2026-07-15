import { DownloadIcon, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { MarketingHero } from "@/components/layout/marketing-hero";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { Reveal } from "@/components/layout/reveal";
import { SiteFooter } from "@/components/layout/site-footer";

const CATEGORIES = ["All", "Resume writing", "Interview prep", "Career growth", "Downloads"];

const ARTICLES = [
  {
    category: "Resume writing",
    title: "How long should a resume actually be in 2026?",
    author: "Elena Ruiz",
    readTime: "6 min read",
  },
  {
    category: "Career growth",
    title: "Negotiating your first offer: scripts that work",
    author: "Marcus Chen",
    readTime: "9 min read",
  },
  {
    category: "Interview prep",
    title: "30 questions to ask your interviewer (that impress)",
    author: "Priya Nair",
    readTime: "7 min read",
  },
  {
    category: "Resume writing",
    title: "Career gaps: how to frame them honestly",
    author: "Elena Ruiz",
    readTime: "5 min read",
  },
  {
    category: "Downloads",
    title: "Job search tracker — free Notion & Sheets template",
    author: "ResoVo Team",
    readTime: "Template",
  },
  {
    category: "Career growth",
    title: "Switching careers at 35+: a field guide",
    author: "Marcus Chen",
    readTime: "11 min read",
  },
];

export default function ResourcesPage() {
  return (
    <>
      <MarketingNav active="/resources" />

      <main className="flex flex-1 flex-col">
        <MarketingHero
          eyebrow="Resources"
          title={
            <>
              The career <span className="gradient-text-static">knowledge hub</span>
            </>
          }
          subtitle="Guides, templates, and expert advice for every stage of the job search."
        >
          <div className="bg-card animate-fade-up stagger-3 hover:border-primary/40 mt-2 flex w-full max-w-md items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-[border-color,box-shadow] duration-200 hover:shadow-md">
            <SearchIcon className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm">
              Search articles, guides, checklists…
            </span>
          </div>

          <div className="animate-fade-up stagger-4 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat, i) => (
              <span
                key={cat}
                className={
                  i === 0
                    ? "from-brand-1 to-brand-2 shadow-primary/30 rounded-full bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white shadow-md"
                    : "hover:border-primary/50 hover:text-primary bg-card cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                }
              >
                {cat}
              </span>
            ))}
          </div>
        </MarketingHero>

        {/* Featured */}
        <section className="py-16">
          <Container className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Reveal className="col-span-2">
              <Card className="bg-brand animate-gradient-pan relative flex h-full flex-col justify-end gap-3 overflow-hidden border-none p-10 text-white shadow-xl transition-transform duration-300 hover:-translate-y-1">
                <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-50" />
                <div className="animate-float-slow pointer-events-none absolute -top-16 -right-10 size-64 rounded-full bg-white/10 blur-3xl" />
                <Badge className="relative w-fit bg-white text-slate-900">
                  Featured guide
                </Badge>
                <h2 className="font-heading relative max-w-md text-2xl font-bold text-balance sm:text-3xl">
                  The 2026 guide to beating applicant tracking systems
                </h2>
                <p className="relative text-sm text-white/70">
                  Everything we learned from parsing 1M+ job applications.
                </p>
                <span className="relative mt-2 text-sm font-semibold text-white">
                  18 min read · Read the guide →
                </span>
              </Card>
            </Reveal>
            <Reveal delay={120} className="flex flex-col gap-5">
              <Card className="hover-glow gap-2 p-6">
                <Badge variant="secondary" className="w-fit">
                  Download
                </Badge>
                <h3 className="font-heading text-base font-semibold">
                  50 action verbs recruiters love — cheat sheet
                </h3>
                <span className="text-primary mt-1 inline-flex items-center gap-1.5 text-sm font-semibold">
                  Get the PDF <DownloadIcon className="size-3.5" />
                </span>
              </Card>
              <Card className="hover-glow gap-2 p-6">
                <Badge variant="secondary" className="w-fit">
                  Interview prep
                </Badge>
                <h3 className="font-heading text-base font-semibold">
                  The STAR method, explained with real answers
                </h3>
                <span className="text-primary mt-1 text-sm font-semibold">
                  Read article →
                </span>
              </Card>
            </Reveal>
          </Container>
        </section>

        {/* Article grid */}
        <section className="pb-8">
          <Container className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map((article, i) => (
              <Reveal key={article.title} delay={(i % 3) * 90}>
                <Card className="hover-glow group h-full gap-0 overflow-hidden py-0">
                  <div className="from-brand-1/20 via-brand-2/20 to-brand-3/20 flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br">
                    <div className="flex size-full items-center justify-center transition-transform duration-500 group-hover:scale-105">
                      <span className="text-muted-foreground font-mono text-[10px]">
                        article cover
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-6">
                    <Badge variant="secondary" className="w-fit">
                      {article.category.toUpperCase()}
                    </Badge>
                    <h3 className="font-heading text-base leading-snug font-semibold">
                      {article.title}
                    </h3>
                    <span className="text-muted-foreground text-xs">
                      {article.author} · {article.readTime}
                    </span>
                  </div>
                </Card>
              </Reveal>
            ))}
          </Container>
        </section>

        <section className="pb-16 text-center">
          <Button variant="outline">Load more articles</Button>
        </section>

        {/* Newsletter */}
        <section className="pb-24">
          <Container>
            <Reveal>
              <div className="bg-brand animate-gradient-pan glow relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl p-10 text-center sm:flex-row sm:justify-between sm:p-14 sm:text-left">
                <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-50" />
                <div className="relative">
                  <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
                    Career tips worth opening
                  </h2>
                  <p className="mt-2 text-white/80">
                    One email a month. The best of the hub, no fluff.
                  </p>
                </div>
                <form className="relative flex w-full max-w-sm gap-2 sm:w-auto">
                  <input
                    type="email"
                    placeholder="you@email.com"
                    className="w-full rounded-xl border border-white/30 bg-white/15 px-4 py-3 text-sm text-white placeholder:text-white/70 outline-none focus:border-white/60"
                  />
                  <Button variant="secondary" type="submit">
                    Subscribe
                  </Button>
                </form>
              </div>
            </Reveal>
          </Container>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
