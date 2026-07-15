"use client";

import * as React from "react";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/container";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export type NavLink = {
  label: string;
  href: string;
  active?: boolean;
};

type NavbarProps = React.ComponentProps<"header"> & {
  brand?: React.ReactNode;
  links?: NavLink[];
  actions?: React.ReactNode;
  /** Rendered at the far right, after the theme toggle (e.g. profile menu). */
  trailing?: React.ReactNode;
};

function NavbarBrand({
  href = "/",
  name = "ResoVo",
}: {
  href?: string;
  name?: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <span className="from-primary to-primary/70 font-heading text-primary-foreground group-hover:shadow-primary/30 flex size-8 items-center justify-center rounded-lg bg-gradient-to-br text-base font-bold transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-4deg] group-hover:shadow-lg">
        {name.charAt(0)}
      </span>
      <span className="font-heading text-foreground text-lg font-bold tracking-tight">
        {name}
      </span>
    </Link>
  );
}

function Navbar({
  brand,
  links = [],
  actions,
  trailing,
  className,
  ...props
}: NavbarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <header
      data-slot="navbar"
      className={cn(
        "bg-background/80 supports-[backdrop-filter]:bg-background/65 sticky top-0 z-40 border-b supports-[backdrop-filter]:backdrop-blur-xl",
        className,
      )}
      {...props}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        {brand ?? <NavbarBrand />}

        {links.length > 0 && (
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.active ? "page" : undefined}
                className={cn(
                  "after:bg-primary relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 after:absolute after:inset-x-3.5 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:transition-transform after:duration-300 after:ease-out hover:after:scale-x-100",
                  link.active
                    ? "bg-accent text-accent-foreground after:scale-x-100"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {actions && (
            <div className="hidden items-center gap-2 md:flex">{actions}</div>
          )}

          <ThemeToggle />

          {trailing}

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="border-input hover:bg-accent flex size-10 items-center justify-center rounded-lg border transition-colors active:scale-95 md:hidden"
          >
            {open ? (
              <XIcon className="size-4.5" />
            ) : (
              <MenuIcon className="size-4.5" />
            )}
          </button>
        </div>
      </Container>

      {open && (links.length > 0 || actions) && (
        <div className="animate-fade-in border-t [animation-duration:200ms] md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                  link.active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            {actions && (
              <div className="flex flex-col gap-2 pt-2">{actions}</div>
            )}
          </Container>
        </div>
      )}
    </header>
  );
}

export { Navbar, NavbarBrand };
