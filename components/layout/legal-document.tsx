import { Container } from "@/components/layout/container";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { SiteFooter } from "@/components/layout/site-footer";

type LegalSection = {
  heading: string;
  body: string[];
};

type LegalDocumentProps = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

/** Shared layout for prose-heavy legal pages (privacy, terms, security, cookies). */
function LegalDocument({ title, updated, intro, sections }: LegalDocumentProps) {
  return (
    <>
      <MarketingNav />

      <main className="flex flex-1 flex-col">
        <Container className="max-w-3xl py-16 sm:py-24">
          <span className="text-muted-foreground text-sm">Last updated: {updated}</span>
          <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="text-muted-foreground mt-4 text-pretty">{intro}</p>

          <div className="mt-10 flex flex-col gap-8">
            {sections.map((section) => (
              <div key={section.heading} className="flex flex-col gap-3">
                <h2 className="font-heading text-lg font-semibold">{section.heading}</h2>
                {section.body.map((paragraph, i) => (
                  <p key={i} className="text-muted-foreground text-sm leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Container>

        <SiteFooter />
      </main>
    </>
  );
}

export { LegalDocument };
