"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Palette } from "lucide-react";

import { PageColorPicker } from "@/components/editor/page-color-picker";
import { PageSizePicker } from "@/components/editor/page-size-picker";
import { Card } from "@/components/ui/card";
import type { PageSize, ResumePageColor } from "@/lib/enums";

type Props = {
  pageColor: ResumePageColor;
  pageSize: PageSize;
  onChange: (patch: {
    pageColor?: ResumePageColor;
    pageSize?: PageSize;
  }) => void;
};

export function CoverLetterDesignControls({
  pageColor,
  pageSize,
  onChange,
}: Props) {
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
          Page color &amp; size
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
              Page color
            </span>
            <PageColorPicker
              value={pageColor}
              onChange={(color) => onChange({ pageColor: color })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Page size
            </span>
            <PageSizePicker
              value={pageSize}
              onChange={(size) => onChange({ pageSize: size })}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
