import { Suspense } from "react";
import type { Metadata } from "next";

import { VerifyEmailStatus } from "@/components/auth/verify-email-status";
import { Container } from "@/components/layout/container";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const metadata: Metadata = {
  title: "Verify Email | ResoVo",
};

export default function VerifyEmailPage() {
  return (
    <main className="from-primary/[0.06] via-background to-background relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-b">
      <div className="bg-primary/10 animate-float-slow pointer-events-none absolute -top-32 -right-24 size-96 rounded-full blur-3xl" />
      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <ThemeToggle className="bg-background/70 backdrop-blur-sm" />
      </div>
      <Container className="animate-fade-up relative flex w-full max-w-sm flex-col gap-6 py-10 sm:py-16">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Email verification
          </h1>
        </div>
        <div className="bg-card rounded-2xl border p-6 shadow-lg shadow-black/[0.04]">
          <Suspense fallback={null}>
            <VerifyEmailStatus />
          </Suspense>
        </div>
      </Container>
    </main>
  );
}
