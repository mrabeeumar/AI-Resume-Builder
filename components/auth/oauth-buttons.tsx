"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

const PROVIDERS = [
  { id: "google", label: "Continue with Google" },
  { id: "linkedin", label: "Continue with LinkedIn" },
] as const;

export function OAuthButtons({ callbackUrl }: { callbackUrl?: string }) {
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const handleSignIn = async (provider: string) => {
    setPendingProvider(provider);
    try {
      await signIn(provider, { callbackUrl: callbackUrl ?? "/dashboard" });
    } finally {
      setPendingProvider(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          disabled={pendingProvider !== null}
          onClick={() => handleSignIn(provider.id)}
        >
          {pendingProvider === provider.id ? "Redirecting..." : provider.label}
        </Button>
      ))}
    </div>
  );
}
