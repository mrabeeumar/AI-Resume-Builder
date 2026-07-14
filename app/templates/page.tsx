import { Container } from "@/components/layout/container";
import { MarketingHero } from "@/components/layout/marketing-hero";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { TemplateGallery } from "./template-gallery";

export default function TemplatesPage() {
  return (
    <>
      <MarketingNav active="/templates" />

      <main className="flex flex-1 flex-col">
        <MarketingHero
          eyebrow="Template gallery"
          title={
            <>
              Find the template{" "}
              <span className="gradient-text-static">recruiters remember</span>
            </>
          }
          subtitle="Every template is ATS-tested, typographically tuned, and ready to fill with AI."
        />

        <section className="py-16 sm:py-20">
          <Container>
            <TemplateGallery />
          </Container>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
