import { GaugeIcon } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/layout/container";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Templates", href: "/templates" },
      { label: "Pricing", href: "/pricing" },
      { label: "Resources", href: "/resources" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Security", href: "/security" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
];

function SiteFooter() {
  return (
    <footer className="bg-foreground text-background/70">
      <Container className="grid grid-cols-2 gap-8 py-14 sm:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
          <span className="text-background flex items-center gap-2 font-heading text-lg font-bold">
            <span className="from-brand-1 to-brand-2 flex size-8 items-center justify-center rounded-lg bg-gradient-to-br text-white">
              R
            </span>
            ResoVo
          </span>
          <p className="text-background/50 text-sm">
            The AI resume builder that gets you hired.
          </p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <span className="text-background text-sm font-semibold">
              {col.title}
            </span>
            {col.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-background text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </Container>
      <div className="border-background/10 border-t">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <span className="text-background/50 text-sm">
            © {new Date().getFullYear()} ResoVo, Inc. All rights reserved.
          </span>
          <div className="flex items-center gap-2 text-sm">
            <GaugeIcon className="text-background/50 size-4" />
            <span className="text-background/50">
              Built for speed & ATS accuracy
            </span>
          </div>
        </Container>
      </div>
    </footer>
  );
}

export { SiteFooter };
