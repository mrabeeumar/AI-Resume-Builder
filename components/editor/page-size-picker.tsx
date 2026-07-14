"use client";

import { PAGE_SIZES, type PageSize } from "@/lib/enums";
import {
  PAGE_SIZE_DESCRIPTIONS,
  PAGE_SIZE_LABELS,
} from "@/lib/resume-templates";
import { cn } from "@/lib/utils";

type Props = {
  value: PageSize;
  onChange: (size: PageSize) => void;
};

// Shared segmented page-size control used by both the resume and cover
// letter design controls.
export function PageSizePicker({ value, onChange }: Props) {
  return (
    <div className="bg-muted inline-flex flex-wrap items-center gap-1 rounded-lg p-1">
      {PAGE_SIZES.map((size) => {
        const active = size === value;
        return (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            title={PAGE_SIZE_DESCRIPTIONS[size]}
            aria-pressed={active}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {PAGE_SIZE_LABELS[size]}
          </button>
        );
      })}
    </div>
  );
}
