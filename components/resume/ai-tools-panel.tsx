"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ResumeSectionItem } from "@/types/resume-section";
import type { KeywordSuggestions } from "@/types/ai";

type Props = {
  resumeId: string;
  onGenerated: (sections: ResumeSectionItem[]) => void;
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

// Resume-level AI actions: generating full section content from a
// background description, and analyzing a target job description for
// missing keywords. Both are opt-in and require explicit confirmation
// before generation overwrites existing content.
export function AiToolsPanel({ resumeId, onGenerated }: Props) {
  const [background, setBackground] = useState("");
  const [generateJobDescription, setGenerateJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false);

  const [keywordJobDescription, setKeywordJobDescription] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [keywordError, setKeywordError] = useState<string | null>(null);
  const [keywordResult, setKeywordResult] = useState<KeywordSuggestions | null>(
    null,
  );

  const handleGenerateClick = () => {
    if (background.trim().length < 20) {
      setGenerateError("Add a bit more background (at least 20 characters).");
      return;
    }
    setGenerateError(null);
    setConfirmGenerateOpen(true);
  };

  const handleGenerate = async () => {
    setConfirmGenerateOpen(false);
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          background,
          jobDescription: generateJobDescription,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setGenerateError(data?.error ?? GENERIC_ERROR);
        return;
      }

      onGenerated(data.sections as ResumeSectionItem[]);
    } catch {
      setGenerateError(GENERIC_ERROR);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeKeywords = async () => {
    if (keywordJobDescription.trim().length < 20) {
      setKeywordError(
        "Paste a fuller job description (at least 20 characters).",
      );
      return;
    }

    setIsOptimizing(true);
    setKeywordError(null);
    setKeywordResult(null);

    try {
      const response = await fetch(
        `/api/resumes/${resumeId}/keyword-optimize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription: keywordJobDescription }),
        },
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setKeywordError(data?.error ?? GENERIC_ERROR);
        return;
      }

      setKeywordResult(data as KeywordSuggestions);
    } catch {
      setKeywordError(GENERIC_ERROR);
    } finally {
      setIsOptimizing(false);
    }
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
          <TabsList>
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="keywords">Keyword optimization</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ai-background">Your background</Label>
              <Textarea
                id="ai-background"
                rows={4}
                placeholder="Summarize your work history, education, skills, and projects..."
                value={background}
                onChange={(e) => setBackground(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ai-generate-job">
                Target job description (optional)
              </Label>
              <Textarea
                id="ai-generate-job"
                rows={3}
                placeholder="Paste a job description to tailor the generated resume"
                value={generateJobDescription}
                onChange={(e) => setGenerateJobDescription(e.target.value)}
              />
            </div>
            {generateError && (
              <p className="text-destructive text-sm">{generateError}</p>
            )}
            <Button
              type="button"
              size="sm"
              className="self-start"
              disabled={isGenerating}
              onClick={handleGenerateClick}
            >
              {isGenerating && <Spinner />}
              {isGenerating ? "Generating..." : "Generate resume content"}
            </Button>
            <AlertDialog
              open={confirmGenerateOpen}
              onOpenChange={setConfirmGenerateOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Overwrite resume content?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will overwrite your summary, experience, education,
                    skills, and projects sections with AI-generated content.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleGenerate}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="keywords">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ai-keyword-job">Target job description</Label>
              <Textarea
                id="ai-keyword-job"
                rows={3}
                placeholder="Paste a job description to find missing keywords"
                value={keywordJobDescription}
                onChange={(e) => setKeywordJobDescription(e.target.value)}
              />
            </div>
            {keywordError && (
              <p className="text-destructive text-sm">{keywordError}</p>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="self-start"
              disabled={isOptimizing}
              onClick={handleOptimizeKeywords}
            >
              {isOptimizing && <Spinner />}
              {isOptimizing ? "Analyzing..." : "Find missing keywords"}
            </Button>

            {keywordResult && (
              <div className="flex flex-col gap-3 text-sm">
                {keywordResult.missingKeywords.length > 0 && (
                  <div>
                    <p className="text-muted-foreground font-medium">
                      Missing keywords
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {keywordResult.missingKeywords.map((keyword) => (
                        <Badge key={keyword} variant="warning">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {keywordResult.suggestions.length > 0 && (
                  <div>
                    <p className="text-muted-foreground font-medium">
                      Suggestions
                    </p>
                    <ul className="mt-1 list-disc pl-5">
                      {keywordResult.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {keywordResult.missingKeywords.length === 0 &&
                  keywordResult.suggestions.length === 0 && (
                    <p className="text-muted-foreground">
                      No significant gaps found — this resume already covers the
                      job description well.
                    </p>
                  )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
