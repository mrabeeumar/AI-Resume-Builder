import Link from "next/link";
import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Container } from "@/components/layout/container";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const metadata: Metadata = {
  title: "Forgot Password | ResoVo",
};

export default function ForgotPasswordPage() {
  return (
    <main className="from-primary/[0.06] via-background to-background relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-b">
      <div className="bg-primary/10 animate-float-slow pointer-events-none absolute -top-32 -right-24 size-96 rounded-full blur-3xl" />
      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <ThemeToggle className="bg-background/70 backdrop-blur-sm" />
      </div>
      <Container className="animate-fade-up relative flex w-full max-w-sm flex-col gap-6 py-10 sm:py-16">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Forgot your password?
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>
        <div className="bg-card rounded-2xl border p-6 shadow-lg shadow-black/[0.04]">
          <ForgotPasswordForm />
        </div>
        <p className="text-muted-foreground text-center text-sm">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </Container>
    </main>
  );
}
