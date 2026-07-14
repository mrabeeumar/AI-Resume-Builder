"use client";

import { useState } from "react";
import { PenLine, Sparkles, Target } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToneSelect } from "@/components/cover-letter/tone-select";
import type { CoverLetterTone } from "@/lib/enums";
import type { CoverLetterItem } from "@/types/cover-letter";

type Props = {
  coverLetterId: string;
  hasContent: boolean;
  onUpdated: (coverLetter: CoverLetterItem) => void;
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

// AI actions for a cover letter: generate from scratch, rewrite the
// existing letter in a different tone/style, or customize it toward a
// specific job description. Each overwrites the letter content, so a
// version snapshot is taken server-side before every call.
export function AiToolsPanel({ coverLetterId, hasContent, onUpdated }: Props) {
  const [background, setBackground] = useState("");
  const [generateJobDescription, setGenerateJobDescription] = useState("");
  const [generateTone, setGenerateTone] =
    useState<CoverLetterTone>("PROFESSIONAL");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [rewriteInstructions, setRewriteInstructions] = useState("");
  const [rewriteTone, setRewriteTone] =
    useState<CoverLetterTone>("PROFESSIONAL");
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  const [customizeJobDescription, setCustomizeJobDescription] = useState("");
  const [customizeTone, setCustomizeTone] =
    useState<CoverLetterTone>("PROFESSIONAL");
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizeError, setCustomizeError] = useState<string | null>(null);

  const [pendingGenerate, setPendingGenerate] = useState(false);

  const runAction = async (
    endpoint: string,
    body: unknown,
    setError: (error: string | null) => void,
    setBusy: (busy: boolean) => void,
  ) => {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/cover-letters/${coverLetterId}/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? GENERIC_ERROR);
        return;
      }

      onUpdated(data.coverLetter as CoverLetterItem);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setBusy(false);
    }
  };

  const runGenerate = () => {
    setPendingGenerate(false);
    runAction(
      "generate",
      {
        background,
        jobDescription: generateJobDescription,
        tone: generateTone,
      },
      setGenerateError,
      setIsGenerating,
    );
  };

  const handleGenerate = () => {
    if (background.trim().length < 20) {
      setGenerateError("Add a bit more background (at least 20 characters).");
      return;
    }
    setGenerateError(null);

    if (hasContent) {
      setPendingGenerate(true);
      return;
    }

    runGenerate();
  };

  const handleRewrite = () => {
    if (!hasContent) {
      setRewriteError("Generate or write content before rewriting.");
      return;
    }

    runAction(
      "rewrite",
      { instructions: rewriteInstructions, tone: rewriteTone },
      setRewriteError,
      setIsRewriting,
    );
  };

  const handleCustomize = () => {
    if (!hasContent) {
      setCustomizeError("Generate or write content before customizing.");
      return;
    }
    if (customizeJobDescription.trim().length < 20) {
      setCustomizeError(
        "Paste a fuller job description (at least 20 characters).",
      );
      return;
    }

    runAction(
      "customize",
      { jobDescription: customizeJobDescription, tone: customizeTone },
      setCustomizeError,
      setIsCustomizing,
    );
  };

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-border border-b py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-md">
            <Sparkles className="size-3.5" />
          </span>
          AI tools
        </CardTitle>
      </CardHeader>
      <CardContent className="py-4">
        <Tabs defaultValue="generate">
          <TabsList className="w-full">
            <TabsTrigger value="generate" className="flex-1">
              <Sparkles className="size-3.5" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="rewrite" className="flex-1">
              <PenLine className="size-3.5" />
              Rewrite
            </TabsTrigger>
            <TabsTrigger value="customize" className="flex-1">
              <Target className="size-3.5" />
              Customize
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <p className="text-muted-foreground text-sm">
              Write a brand-new letter from your background. Replaces the
              current content.
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cl-background">Your background</Label>
              <Textarea
                id="cl-background"
                rows={4}
                placeholder="Summarize your work history, skills, and what you're looking for..."
                value={background}
                onChange={(e) => setBackground(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cl-generate-job">
                Target job description (optional)
              </Label>
              <Textarea
                id="cl-generate-job"
                rows={3}
                placeholder="Paste a job description to tailor the generated letter"
                value={generateJobDescription}
                onChange={(e) => setGenerateJobDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cl-generate-tone">Tone</Label>
              <ToneSelect
                id="cl-generate-tone"
                value={generateTone}
                onChange={setGenerateTone}
              />
            </div>
            {generateError && (
              <p className="text-destructive text-sm">{generateError}</p>
            )}
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating && <Spinner />}
              {isGenerating ? "Generating..." : "Generate cover letter"}
            </Button>
            <AlertDialog
              open={pendingGenerate}
              onOpenChange={setPendingGenerate}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Overwrite letter content?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will overwrite your current letter content.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={runGenerate}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="rewrite">
            <p className="text-muted-foreground text-sm">
              Rework the existing letter — adjust tone, tighten wording, or
              follow specific instructions.
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cl-rewrite-instructions">
                Instructions (optional)
              </Label>
              <Textarea
                id="cl-rewrite-instructions"
                rows={2}
                placeholder="e.g. make it more concise and lead with my biggest achievement"
                value={rewriteInstructions}
                onChange={(e) => setRewriteInstructions(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cl-rewrite-tone">Tone</Label>
              <ToneSelect
                id="cl-rewrite-tone"
                value={rewriteTone}
                onChange={setRewriteTone}
              />
            </div>
            {rewriteError && (
              <p className="text-destructive text-sm">{rewriteError}</p>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full"
              disabled={isRewriting || !hasContent}
              onClick={handleRewrite}
            >
              {isRewriting && <Spinner />}
              {isRewriting ? "Rewriting..." : "Rewrite letter"}
            </Button>
          </TabsContent>

          <TabsContent value="customize">
            <p className="text-muted-foreground text-sm">
              Tailor the existing letter toward a specific job description.
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cl-customize-job">Target job description</Label>
              <Textarea
                id="cl-customize-job"
                rows={3}
                placeholder="Paste a job description to tailor this letter toward it"
                value={customizeJobDescription}
                onChange={(e) => setCustomizeJobDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cl-customize-tone">Tone</Label>
              <ToneSelect
                id="cl-customize-tone"
                value={customizeTone}
                onChange={setCustomizeTone}
              />
            </div>
            {customizeError && (
              <p className="text-destructive text-sm">{customizeError}</p>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full"
              disabled={isCustomizing || !hasContent}
              onClick={handleCustomize}
            >
              {isCustomizing && <Spinner />}
              {isCustomizing ? "Customizing..." : "Customize letter"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
