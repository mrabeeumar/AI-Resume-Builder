"use client";

import { useState } from "react";
import { Eye, EyeOff, FileEdit, Sparkles, Trash2 } from "lucide-react";

import { useResumeEditor } from "@/components/resume/editor/resume-editor-provider";
import { SectionForm } from "@/components/resume/section-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { rewriteSection } from "@/lib/resume-editor-client";
import { SECTION_TYPE_LABELS } from "@/types/resume-section";

function RewriteForm({ onClose }: { onClose: () => void }) {
  const { resumeId, activeSection, replaceSectionContent } = useResumeEditor();
  const [instructions, setInstructions] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activeSection) return null;

  const handleRewrite = async () => {
    setIsRewriting(true);
    setError(null);

    const result = await rewriteSection(resumeId, activeSection.id, {
      instructions,
      jobDescription,
    });
    setIsRewriting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    replaceSectionContent(activeSection.id, result.data.section.content);
    onClose();
  };

  return (
    <div className="border-primary/25 bg-primary/5 flex flex-col gap-3 rounded-xl border p-4">
      <div className="text-primary flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4" />
        Rewrite with AI
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-xs" htmlFor="rewrite-instructions">
          Instructions (optional)
        </Label>
        <Textarea
          id="rewrite-instructions"
          rows={2}
          placeholder="e.g. make it more concise and quantify results"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="bg-background"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-xs" htmlFor="rewrite-job">
          Target job description (optional)
        </Label>
        <Textarea
          id="rewrite-job"
          rows={3}
          placeholder="Paste a job description to tailor this section toward it"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="bg-background"
        />
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isRewriting}
          onClick={handleRewrite}
        >
          {isRewriting ? "Rewriting..." : "Rewrite this section"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function SectionEditorPanel() {
  const { activeSection, error, toggleHidden, deleteSection, updateContent } =
    useResumeEditor();
  const [showRewriteForm, setShowRewriteForm] = useState(false);

  if (!activeSection) {
    return (
      <Card className="p-4 sm:p-6">
        <EmptyState
          icon={FileEdit}
          title="No section selected"
          description="Select a section from the left, or add one to start building your resume."
        />
      </Card>
    );
  }

  return (
    <Card className="gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-foreground text-lg font-semibold">
            {SECTION_TYPE_LABELS[activeSection.type]}
          </h2>
          {activeSection.hidden && <Badge variant="secondary">Hidden</Badge>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant={showRewriteForm ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowRewriteForm((prev) => !prev)}
          >
            <Sparkles className="size-4" />
            Rewrite with AI
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleHidden(activeSection.id)}
          >
            {activeSection.hidden ? (
              <>
                <Eye className="size-4" />
                Show
              </>
            ) : (
              <>
                <EyeOff className="size-4" />
                Hide
              </>
            )}
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            }
            title={`Delete the ${SECTION_TYPE_LABELS[activeSection.type]} section?`}
            description="This cannot be undone."
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={() => deleteSection(activeSection.id)}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {showRewriteForm && (
        <RewriteForm onClose={() => setShowRewriteForm(false)} />
      )}

      <SectionForm
        key={activeSection.id}
        type={activeSection.type}
        content={activeSection.content}
        onChange={(content) => updateContent(activeSection.id, content)}
      />
    </Card>
  );
}
