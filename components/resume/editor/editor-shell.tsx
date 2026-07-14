"use client";

import { EditorHeader } from "@/components/resume/editor/editor-header";
import { PreviewPanel } from "@/components/resume/editor/preview-panel";
import { SectionEditorPanel } from "@/components/resume/editor/section-editor-panel";
import { SectionNav } from "@/components/resume/editor/section-nav";

// Three-pane workspace: section navigator, active-section editor, and a live
// preview that stays in sync with every edit. Collapses to a single column
// on smaller screens (nav → editor → preview).
export function EditorShell() {
  return (
    <div className="flex flex-col gap-6">
      <EditorHeader />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_minmax(0,26rem)]">
        <aside className="lg:sticky lg:top-6">
          <SectionNav />
        </aside>
        <SectionEditorPanel />
        <aside className="lg:col-span-2 xl:col-span-1 xl:sticky xl:top-6">
          <PreviewPanel />
        </aside>
      </div>
    </div>
  );
}
