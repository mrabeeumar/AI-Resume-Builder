import { Suspense } from "react";
import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Container } from "@/components/layout/container";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const metadata: Metadata = {
  title: "Reset Password | ResoVo",
};

export default function ResetPasswordPage() {
  return (
    <main className="from-primary/[0.06] via-background to-background relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-b">
      <div className="bg-primary/10 animate-float-slow pointer-events-none absolute -top-32 -left-24 size-96 rounded-full blur-3xl" />
      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <ThemeToggle className="bg-background/70 backdrop-blur-sm" />
      </div>
      <Container className="animate-fade-up relative flex w-full max-w-sm flex-col gap-6 py-10 sm:py-16">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Reset your password
          </h1>
          <p className="text-muted-foreground text-sm">
            Choose a new password for your account.
          </p>
        </div>
        <div className="bg-card rounded-2xl border p-6 shadow-lg shadow-black/[0.04]">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </Container>
    </main>
  );
}
