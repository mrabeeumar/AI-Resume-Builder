import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { MarketingHero } from "@/components/layout/marketing-hero";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { Reveal } from "@/components/layout/reveal";
import { SiteFooter } from "@/components/layout/site-footer";

const POSTS = [
  {
    category: "Product",
    title: "How ResoVo scores your resume against real ATS parsers",
    date: "Jun 2026",
    readTime: "6 min read",
  },
  {
    category: "Resume writing",
    title: "How long should a resume actually be in 2026?",
    date: "May 2026",
    readTime: "6 min read",
  },
  {
    category: "Career growth",
    title: "Negotiating your first offer: scripts that work",
    date: "May 2026",
    readTime: "9 min read",
  },
  {
    category: "Interview prep",
    title: "30 questions to ask your interviewer (that impress)",
    date: "Apr 2026",
    readTime: "7 min read",
  },
  {
    category: "Resume writing",
    title: "Career gaps: how to frame them honestly",
    date: "Apr 2026",
    readTime: "5 min read",
  },
  {
    category: "Career growth",
    title: "Switching careers at 35+: a field guide",
    date: "Mar 2026",
    readTime: "11 min read",
  },
];

export default function BlogPage() {
  return (
    <>
      <MarketingNav />

      <main className="flex flex-1 flex-col">
        <MarketingHero
          eyebrow="Blog"
          title={
            <>
              Notes on hiring, resumes, and{" "}
              <span className="gradient-text-static">landing the job</span>
            </>
          }
          subtitle="Product updates and career advice from the ResoVo team."
        />

        <section className="py-16 pb-24">
          <Container className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {POSTS.map((post, i) => (
              <Reveal key={post.title} delay={(i % 3) * 90}>
                <Card className="hover-glow group h-full gap-0 overflow-hidden py-0">
                  <div className="from-brand-1/20 via-brand-2/20 to-brand-3/20 flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br">
                    <div className="flex size-full items-center justify-center transition-transform duration-500 group-hover:scale-105">
                      <span className="text-muted-foreground font-mono text-[10px]">
                        post cover
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-6">
                    <Badge variant="secondary" className="w-fit">
                      {post.category.toUpperCase()}
                    </Badge>
                    <h3 className="font-heading text-base leading-snug font-semibold">
                      {post.title}
                    </h3>
                    <span className="text-muted-foreground text-xs">
                      {post.date} · {post.readTime}
                    </span>
                  </div>
                </Card>
              </Reveal>
            ))}
          </Container>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
