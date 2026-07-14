import * as React from "react";

import { Container } from "@/components/layout/container";

type MarketingHeroProps = {
  eyebrow: string;
  /** Headline; compose an inner <span className="gradient-text-static"> for emphasis. */
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional extra content below the copy (search bar, toggles, chips…). */
  children?: React.ReactNode;
};

/** Shared vibrant hero for interior marketing pages. */
function MarketingHero({
  eyebrow,
  title,
  subtitle,
  children,
}: MarketingHeroProps) {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="from-primary/[0.07] to-background pointer-events-none absolute inset-0 bg-gradient-to-b" />
      <div className="bg-primary/15 animate-float-slow pointer-events-none absolute -top-32 left-1/2 size-[560px] -translate-x-1/2 rounded-full blur-3xl" />
      <div className="animate-float-slow pointer-events-none absolute -top-16 right-10 size-72 rounded-full bg-fuchsia-400/10 blur-3xl [animation-delay:-4s]" />

      <Container className="relative flex flex-col items-center gap-5 py-20 text-center sm:py-28">
        <span className="bg-accent text-accent-foreground animate-fade-up inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-xs font-medium tracking-widest uppercase">
          {eyebrow}
        </span>
        <h1 className="font-heading animate-fade-up stagger-1 max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground animate-fade-up stagger-2 max-w-xl text-lg text-pretty">
            {subtitle}
          </p>
        )}
        {children}
      </Container>
    </section>
  );
}

export { MarketingHero };
