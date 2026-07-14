import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Container } from "@/components/layout/container";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const metadata: Metadata = {
  title: "Sign In | AI Resume Builder",
};

export default function LoginPage() {
  return (
    <main className="from-primary/[0.06] via-background to-background relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-b">
      <div className="bg-primary/10 animate-float-slow pointer-events-none absolute -top-32 -right-24 size-96 rounded-full blur-3xl" />
      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <ThemeToggle className="bg-background/70 backdrop-blur-sm" />
      </div>
      <Container className="animate-fade-up relative flex w-full max-w-sm flex-col gap-6 py-10 sm:py-16">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to continue building your career.
          </p>
        </div>
        <div className="bg-card rounded-2xl border p-6 shadow-lg shadow-black/[0.04]">
          <div className="flex flex-col gap-6">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
            <OAuthButtons />
          </div>
        </div>
        <p className="text-muted-foreground text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 transition-colors"
          >
            Create one
          </Link>
        </p>
      </Container>
    </main>
  );
}
