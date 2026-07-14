"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Palette } from "lucide-react";

import { PageColorPicker } from "@/components/editor/page-color-picker";
import { PageSizePicker } from "@/components/editor/page-size-picker";
import { useResumeEditor } from "@/components/resume/editor/resume-editor-provider";
import { ResumePreview } from "@/components/resume/resume-preview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RESUME_TEMPLATE_IDS, RESUME_THEME_COLORS } from "@/lib/enums";
import {
  TEMPLATE_DESCRIPTIONS,
  TEMPLATE_LABELS,
  THEME_COLOR_CLASSES,
  THEME_COLOR_LABELS,
} from "@/lib/resume-templates";
import { cn } from "@/lib/utils";

function DesignControls() {
  const { templateId, themeColor, pageColor, pageSize, setAppearance } =
    useResumeEditor();
  const [open, setOpen] = useState(false);

  return (
    <Card className="gap-0 p-3">
      <button
        type="button"
        className="text-foreground flex w-full items-center justify-between text-sm font-medium"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-md">
            <Palette className="size-3.5" />
          </span>
          Template, color, page &amp; size
        </span>
        {open ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </button>

      {open && (
        <div className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Template
            </span>
            <div className="flex flex-wrap gap-2">
              {RESUME_TEMPLATE_IDS.map((id) => (
                <Button
                  key={id}
                  type="button"
                  variant={id === templateId ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAppearance({ templateId: id })}
                  title={TEMPLATE_DESCRIPTIONS[id]}
                >
                  {TEMPLATE_LABELS[id]}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Accent color
            </span>
            <div className="flex flex-wrap gap-2.5">
              {RESUME_THEME_COLORS.map((color) => {
                const active = color === themeColor;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAppearance({ themeColor: color })}
                    aria-label={THEME_COLOR_LABELS[color]}
                    aria-pressed={active}
                    title={THEME_COLOR_LABELS[color]}
                    className={cn(
                      "ring-offset-background flex size-8 items-center justify-center rounded-full shadow-sm ring-offset-2 transition hover:scale-105",
                      THEME_COLOR_CLASSES[color].swatch,
                      active ? "ring-primary ring-2" : "ring-0",
                    )}
                  >
                    {active && (
                      <Check className="size-3.5 text-white" strokeWidth={3} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Page color
            </span>
            <PageColorPicker
              value={pageColor}
              onChange={(color) => setAppearance({ pageColor: color })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Page size
            </span>
            <PageSizePicker
              value={pageSize}
              onChange={(size) => setAppearance({ pageSize: size })}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

export function PreviewPanel() {
  const { title, sections, templateId, themeColor, pageColor, pageSize } =
    useResumeEditor();

  return (
    <div className="flex flex-col gap-3">
      <DesignControls />
      <Card className="gap-0 p-3">
        <p className="text-muted-foreground px-1 pb-2 text-xs font-semibold tracking-wide uppercase">
          Live preview
        </p>
        <div className="bg-muted/40 max-h-[70vh] overflow-y-auto rounded-lg p-3 print:max-h-none print:overflow-visible print:rounded-none print:bg-transparent print:p-0">
          <ResumePreview
            title={title}
            sections={sections}
            templateId={templateId}
            themeColor={themeColor}
            pageColor={pageColor}
            pageSize={pageSize}
          />
        </div>
      </Card>
    </div>
  );
}
