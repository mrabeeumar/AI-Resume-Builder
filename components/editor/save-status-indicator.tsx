import { CircleCheck, Loader2, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  status: SaveStatus;
  className?: string;
};

// Shared save-state pill used by both the resume and cover letter editor
// headers so autosave feedback reads identically across the app.
export function SaveStatusIndicator({ status, className }: Props) {
  if (status === "idle") {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
        status === "saving" && "bg-muted text-muted-foreground",
        status === "saved" && "bg-success/10 text-success",
        status === "error" && "bg-destructive/10 text-destructive",
        className,
      )}
    >
      {status === "saving" && (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          Saving...
        </>
      )}
      {status === "saved" && (
        <>
          <CircleCheck className="size-3.5" />
          All changes saved
        </>
      )}
      {status === "error" && (
        <>
          <TriangleAlert className="size-3.5" />
          Save failed
        </>
      )}
    </span>
  );
}
