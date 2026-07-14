import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";

const MARKETING_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Templates", href: "/templates" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
] as const;

type MarketingNavProps = {
  /** href of the current page, used to highlight the active link. */
  active?: string;
};

/** Shared top navigation for the public marketing pages. */
function MarketingNav({ active }: MarketingNavProps) {
  return (
    <Navbar
      links={MARKETING_LINKS.map((link) => ({
        ...link,
        active: link.href === active,
      }))}
      actions={
        <>
          <Button asChild variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started free</Link>
          </Button>
        </>
      }
    />
  );
}

export { MarketingNav, MARKETING_LINKS };
