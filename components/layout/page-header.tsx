import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { BackButton } from "@/components/layout/back-button";

type PageHeaderProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
};

/** Consistent, lightly-branded header for the in-app (dashboard) pages. */
function PageHeader({
  icon: Icon,
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
}: PageHeaderProps) {
  return (
    <div className="animate-fade-up flex flex-col gap-4">
      {backHref && <BackButton href={backHref} label={backLabel} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="from-brand-1 to-brand-2 text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg shadow-primary/25">
              <Icon className="size-6" />
            </div>
          )}
          <div>
            <h1 className="text-foreground font-heading text-2xl font-bold tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground mt-1 text-sm">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}

export { PageHeader };
