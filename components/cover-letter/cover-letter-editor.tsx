"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, History } from "lucide-react";

import { AiToolsPanel } from "@/components/cover-letter/ai-tools-panel";
import { CoverLetterContentEditor } from "@/components/cover-letter/cover-letter-content-editor";
import { CoverLetterDesignControls } from "@/components/cover-letter/cover-letter-design-controls";
import {
  SaveStatusIndicator,
  type SaveStatus,
} from "@/components/editor/save-status-indicator";
import { SaveVersionDialog } from "@/components/editor/save-version-dialog";
import { Button } from "@/components/ui/button";
import type { PageSize, ResumePageColor } from "@/lib/enums";
import type { CoverLetterItem } from "@/types/cover-letter";

type Props = {
  coverLetterId: string;
  title: string;
  initialContent: string;
  initialPageColor: ResumePageColor;
  initialPageSize: PageSize;
};

// Two-pane workspace: the letter editor on the left and a sticky AI tools
// sidebar on the right. Collapses to a single column (editor → AI tools)
// on smaller screens.
export function CoverLetterEditor({
  coverLetterId,
  title,
  initialContent,
  initialPageColor,
  initialPageSize,
}: Props) {
  const [content, setContent] = useState(initialContent);
  // Bumped whenever an AI action overwrites content server-side, forcing
  // CoverLetterContentEditor to remount and pick up the new value instead
  // of clobbering it with its own in-flight debounced save.
  const [contentVersion, setContentVersion] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [copied, setCopied] = useState(false);
  const [pageColor, setPageColor] = useState(initialPageColor);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handleAppearanceChange = async (patch: {
    pageColor?: ResumePageColor;
    pageSize?: PageSize;
  }) => {
    const previous = { pageColor, pageSize };
    if (patch.pageColor) setPageColor(patch.pageColor);
    if (patch.pageSize) setPageSize(patch.pageSize);

    setSaveStatus("saving");
    try {
      const response = await fetch(`/api/cover-letters/${coverLetterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!response.ok) {
        setPageColor(previous.pageColor);
        setPageSize(previous.pageSize);
        setSaveStatus("error");
        return;
      }

      setSaveStatus("saved");
    } catch {
      setPageColor(previous.pageColor);
      setPageSize(previous.pageSize);
      setSaveStatus("error");
    }
  };

  const handleUpdated = (coverLetter: CoverLetterItem) => {
    setContent(coverLetter.content);
    setContentVersion((prev) => prev + 1);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied; nothing actionable for the user here.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="text-foreground truncate text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <SaveStatusIndicator status={saveStatus} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={content.trim().length === 0}
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="text-success size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <SaveVersionDialog
            endpoint={`/api/cover-letters/${coverLetterId}/versions`}
            idPrefix="cover-letter"
          />
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/cover-letters/${coverLetterId}/versions`}>
              <History className="size-4" />
              Versions
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-3">
          <CoverLetterDesignControls
            pageColor={pageColor}
            pageSize={pageSize}
            onChange={handleAppearanceChange}
          />
          <CoverLetterContentEditor
            key={contentVersion}
            coverLetterId={coverLetterId}
            content={content}
            pageColor={pageColor}
            pageSize={pageSize}
            onContentChange={setContent}
            onStatusChange={setSaveStatus}
          />
        </div>
        <aside className="lg:sticky lg:top-6">
          <AiToolsPanel
            coverLetterId={coverLetterId}
            hasContent={content.trim().length > 0}
            onUpdated={handleUpdated}
          />
        </aside>
      </div>
    </div>
  );
}
