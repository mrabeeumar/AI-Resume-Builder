"use client";

import { Check } from "lucide-react";

import { RESUME_PAGE_COLORS, type ResumePageColor } from "@/lib/enums";
import { PAGE_COLOR_HEX, PAGE_COLOR_LABELS } from "@/lib/resume-templates";
import { cn } from "@/lib/utils";

type Props = {
  value: ResumePageColor;
  onChange: (color: ResumePageColor) => void;
};

// Shared paper-color swatch row used by both the resume and cover letter
// design controls.
export function PageColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {RESUME_PAGE_COLORS.map((color) => {
        const active = color === value;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={PAGE_COLOR_LABELS[color]}
            aria-pressed={active}
            title={PAGE_COLOR_LABELS[color]}
            style={{ backgroundColor: PAGE_COLOR_HEX[color] }}
            className={cn(
              "ring-offset-background flex size-8 items-center justify-center rounded-full border border-black/10 shadow-sm ring-offset-2 transition hover:scale-105",
              active ? "ring-primary ring-2" : "ring-0",
            )}
          >
            {active && (
              <Check className="size-3.5 text-slate-700" strokeWidth={3} />
            )}
          </button>
        );
      })}
    </div>
  );
}
