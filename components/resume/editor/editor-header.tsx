"use client";

import Link from "next/link";
import { Download, History, Printer, Sparkles } from "lucide-react";

import { AiToolsPanel } from "@/components/resume/ai-tools-panel";
import { useResumeEditor } from "@/components/resume/editor/resume-editor-provider";
import { WorkspaceTabs } from "@/components/resume/editor/workspace-tabs";
import { SaveStatusIndicator } from "@/components/editor/save-status-indicator";
import { SaveVersionDialog } from "@/components/editor/save-version-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function EditorHeader() {
  const { resumeId, title, saveStatus, replaceSections } = useResumeEditor();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="text-foreground truncate text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <SaveStatusIndicator status={saveStatus} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" size="sm" className="glow">
                <Sparkles className="size-4" />
                AI tools
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI tools</DialogTitle>
              </DialogHeader>
              <AiToolsPanel resumeId={resumeId} onGenerated={replaceSections} />
            </DialogContent>
          </Dialog>

          <SaveVersionDialog
            endpoint={`/api/resumes/${resumeId}/versions`}
            idPrefix="resume"
          />

          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/resumes/${resumeId}/versions`}>
              <History className="size-4" />
              Versions
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Download className="size-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Download</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <a href={`/api/resumes/${resumeId}/export?format=pdf`}>
                  <Download className="size-4" />
                  PDF
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/api/resumes/${resumeId}/export?format=docx`}>
                  <Download className="size-4" />
                  Word (.docx)
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => window.print()}>
                <Printer className="size-4" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <WorkspaceTabs resumeId={resumeId} />
    </div>
  );
}
