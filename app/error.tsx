"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center py-16">
      <Container className="flex max-w-md flex-col items-center gap-4 text-center">
        <AlertTriangle className="text-destructive size-10" />
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-lg font-semibold">
            Something went wrong
          </h1>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred while loading this page. You can try
            again, or head back to the dashboard.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href="/dashboard">Back to dashboard</a>
          </Button>
        </div>
      </Container>
    </main>
  );
}
