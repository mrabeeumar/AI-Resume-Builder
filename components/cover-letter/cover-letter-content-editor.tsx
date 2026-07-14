"use client";

import { useState } from "react";
import { NotebookPen } from "lucide-react";

import type { SaveStatus } from "@/components/editor/save-status-indicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type { ResumePageColor, PageSize } from "@/lib/enums";
import { PAGE_COLOR_HEX, PAGE_SIZE_WIDTH_PX } from "@/lib/resume-templates";

type Props = {
  coverLetterId: string;
  content: string;
  pageColor: ResumePageColor;
  pageSize: PageSize;
  onContentChange: (content: string) => void;
  onStatusChange: (status: SaveStatus) => void;
};

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

export function CoverLetterContentEditor({
  coverLetterId,
  content,
  pageColor,
  pageSize,
  onContentChange,
  onStatusChange,
}: Props) {
  const [value, setValue] = useState(content);

  const saveContent = useDebouncedCallback(async (nextContent: string) => {
    onStatusChange("saving");
    try {
      const response = await fetch(`/api/cover-letters/${coverLetterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: nextContent }),
      });

      onStatusChange(response.ok ? "saved" : "error");
    } catch {
      onStatusChange("error");
    }
  }, 800);

  const handleChange = (nextValue: string) => {
    setValue(nextValue);
    onContentChange(nextValue);
    saveContent(nextValue);
  };

  const wordCount = countWords(value);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-border flex-row items-center justify-between border-b py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <NotebookPen className="text-primary size-4" />
          Letter content
        </CardTitle>
        <span className="text-muted-foreground text-xs tabular-nums">
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>
      </CardHeader>
      <CardContent className="bg-muted/40 p-4 sm:p-6">
        <div
          className="border-border mx-auto rounded-md border shadow-sm transition-shadow focus-within:shadow-md"
          style={{
            backgroundColor: PAGE_COLOR_HEX[pageColor],
            maxWidth: PAGE_SIZE_WIDTH_PX[pageSize],
          }}
        >
          <Textarea
            rows={24}
            className="min-h-[32rem] resize-y border-none bg-transparent p-8 text-sm leading-relaxed text-slate-900 shadow-none focus-visible:ring-0 dark:bg-transparent"
            placeholder="Write your cover letter, or generate one with the AI tools alongside..."
            value={value}
            onChange={(e) => handleChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
