"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Status = "verifying" | "success" | "error";

export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [message, setMessage] = useState<string | null>(
    token ? null : "This verification link is invalid.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (cancelled) return;

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setStatus("error");
          setMessage(
            data?.error ?? "This verification link is invalid or has expired.",
          );
          return;
        }

        setStatus("success");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Something went wrong. Please try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "verifying") {
    return (
      <p className="text-muted-foreground text-sm">Verifying your email...</p>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Your email has been verified. You can now sign in.
        </p>
        <Link
          href="/login"
          className="text-primary hover:text-primary/80 text-sm font-medium underline underline-offset-4 transition-colors"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <p role="alert" className="text-destructive text-sm">
      {message}
    </p>
  );
}
