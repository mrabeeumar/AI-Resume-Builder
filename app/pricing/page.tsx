import { MarketingHero } from "@/components/layout/marketing-hero";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { Container } from "@/components/layout/container";
import { PricingTiers } from "./billing-toggle";

const COMPARE_ROWS: { label: string; free: string; pro: string; team: string }[] = [
  { label: "Resumes", free: "3", pro: "Unlimited", team: "Unlimited" },
  { label: "Templates", free: "3", pro: "All", team: "All + custom" },
  { label: "AI calls", free: "20 / 30 days", pro: "Unlimited", team: "Unlimited" },
  { label: "ATS keyword matching", free: "—", pro: "✓", team: "✓" },
  { label: "Cover letters", free: "✓", pro: "✓", team: "✓" },
  { label: "Collaboration & review", free: "—", pro: "—", team: "✓" },
  { label: "Support", free: "Community", pro: "Priority", team: "Dedicated" },
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes — cancel in one click from settings. You keep Pro access until the end of your billing period, and your resumes stay yours forever.",
  },
  {
    q: "What happens to my resumes if I downgrade?",
    a: "Nothing is deleted. You keep viewing and exporting all resumes; the Free plan caps you at 3 resumes and 20 AI calls per 30 days.",
  },
  {
    q: "Do you offer team pricing?",
    a: "Yes — Team plans are billed per seat and include shared templates, a review workflow, and usage analytics for coaches and career centers.",
  },
];

const TRUST_BADGES = [
  "🔒 SOC 2 Type II",
  "GDPR compliant",
  "Cancel anytime",
  "14-day money-back guarantee",
];

export default function PricingPage() {
  return (
    <>
      <MarketingNav active="/pricing" />

      <main className="flex flex-1 flex-col">
        <MarketingHero
          eyebrow="Pricing"
          title={
            <>
              Invest in the resume that{" "}
              <span className="gradient-text-static">pays for itself</span>
            </>
          }
          subtitle="Start free. Upgrade when you're ready to apply seriously."
        >
          <PricingTiers />
        </MarketingHero>

        {/* Trust badges */}
        <section className="flex flex-wrap justify-center gap-3 py-12">
          {TRUST_BADGES.map((badge) => (
            <span
              key={badge}
              className="bg-muted text-muted-foreground rounded-full px-4 py-2 text-xs font-semibold"
            >
              {badge}
            </span>
          ))}
        </section>

        {/* Compare table */}
        <section className="pb-20">
          <Container className="max-w-4xl">
            <h2 className="font-heading text-center text-2xl font-bold sm:text-3xl">
              Compare plans
            </h2>
            <div className="bg-card mt-8 overflow-hidden rounded-2xl border shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="bg-muted/60 border-b text-left">
                      <th className="px-6 py-4 font-medium" />
                      <th className="text-foreground font-heading px-4 py-4 text-center font-semibold">
                        Free
                      </th>
                      <th className="font-heading bg-accent/50 px-4 py-4 text-center font-semibold">
                        <span className="gradient-text-static">Pro</span>
                      </th>
                      <th className="text-foreground font-heading px-4 py-4 text-center font-semibold">
                        Team
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_ROWS.map((row) => (
                      <tr
                        key={row.label}
                        className="hover:bg-muted/40 border-b transition-colors last:border-b-0"
                      >
                        <td className="text-foreground px-6 py-3.5 font-medium">
                          {row.label}
                        </td>
                        <td className="text-muted-foreground px-4 py-3.5 text-center">
                          {row.free}
                        </td>
                        <td className="text-foreground bg-accent/30 px-4 py-3.5 text-center font-semibold">
                          {row.pro}
                        </td>
                        <td className="text-muted-foreground px-4 py-3.5 text-center">
                          {row.team}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="pb-24">
          <Container className="max-w-2xl">
            <h2 className="font-heading text-center text-2xl font-bold sm:text-3xl">
              Pricing questions
            </h2>
            <div className="mt-8 flex flex-col gap-3">
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="group bg-card hover:border-primary/30 rounded-xl border p-5 shadow-xs transition-[border-color,box-shadow] duration-200 hover:shadow-sm"
                >
                  <summary className="font-heading flex cursor-pointer list-none items-center justify-between text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <span className="bg-accent text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-lg transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
