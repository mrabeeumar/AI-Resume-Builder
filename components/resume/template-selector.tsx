"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { RESUME_TEMPLATE_IDS, RESUME_THEME_COLORS } from "@/lib/enums";
import type { ResumeTemplateId, ResumeThemeColor } from "@/lib/enums";
import {
  TEMPLATE_DESCRIPTIONS,
  TEMPLATE_LABELS,
  THEME_COLOR_CLASSES,
  THEME_COLOR_LABELS,
} from "@/lib/resume-templates";
import { cn } from "@/lib/utils";

type Props = {
  resumeId: string;
  templateId: ResumeTemplateId;
  themeColor: ResumeThemeColor;
  onChange: (next: {
    templateId: ResumeTemplateId;
    themeColor: ResumeThemeColor;
  }) => void;
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

export function TemplateSelector({
  resumeId,
  templateId,
  themeColor,
  onChange,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = async (next: {
    templateId?: ResumeTemplateId;
    themeColor?: ResumeThemeColor;
  }) => {
    setError(null);
    setIsSaving(true);

    const previous = { templateId, themeColor };
    onChange({ ...previous, ...next });

    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? GENERIC_ERROR);
        onChange(previous);
      }
    } catch {
      setError(GENERIC_ERROR);
      onChange(previous);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-sm">Template</span>
        <div className="flex flex-wrap gap-2">
          {RESUME_TEMPLATE_IDS.map((id) => (
            <Button
              key={id}
              type="button"
              variant={id === templateId ? "default" : "outline"}
              size="sm"
              disabled={isSaving}
              onClick={() => persist({ templateId: id })}
              title={TEMPLATE_DESCRIPTIONS[id]}
            >
              {TEMPLATE_LABELS[id]}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-sm">Color</span>
        <div className="flex flex-wrap gap-2">
          {RESUME_THEME_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              disabled={isSaving}
              onClick={() => persist({ themeColor: color })}
              aria-label={THEME_COLOR_LABELS[color]}
              aria-pressed={color === themeColor}
              title={THEME_COLOR_LABELS[color]}
              className={cn(
                "ring-offset-background size-7 rounded-full ring-offset-2 transition disabled:opacity-50",
                THEME_COLOR_CLASSES[color].swatch,
                color === themeColor ? "ring-ring ring-2" : "ring-0",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
