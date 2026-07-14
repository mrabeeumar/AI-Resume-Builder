"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  text: string;
  context?: string;
  onApply: (improved: string) => void;
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

// Reusable "Improve with AI" action for a single bullet/description field.
// Shows a preview the user must explicitly accept before it replaces the
// original text, since AI output should never silently overwrite input.
export function ImproveBulletButton({ text, context, onApply }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleImprove = async () => {
    if (!text.trim()) {
      return;
    }

    setStatus("loading");
    setSuggestion(null);

    try {
      const response = await fetch("/api/ai/improve-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus("error");
        return;
      }

      setSuggestion(data.improved as string);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const handleAccept = () => {
    if (suggestion) {
      onApply(suggestion);
    }
    setSuggestion(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={status === "loading" || !text.trim()}
          onClick={handleImprove}
        >
          {status === "loading" && <Spinner />}
          {status === "loading" ? "Improving..." : "Improve with AI"}
        </Button>
        {status === "error" && (
          <span className="text-destructive text-xs">{GENERIC_ERROR}</span>
        )}
      </div>

      {suggestion && (
        <Card className="bg-muted/50 gap-2 p-3 text-sm">
          <p>{suggestion}</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleAccept}>
              Use this
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSuggestion(null)}
            >
              Discard
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
