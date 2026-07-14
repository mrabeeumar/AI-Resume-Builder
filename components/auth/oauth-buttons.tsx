"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Continue with Google",
  linkedin: "Continue with LinkedIn",
};

export function OAuthButtons({ callbackUrl }: { callbackUrl?: string }) {
  const [availableProviderIds, setAvailableProviderIds] = useState<string[]>(
    [],
  );
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getProviders().then((providers) => {
      if (cancelled || !providers) return;
      setAvailableProviderIds(
        Object.keys(providers).filter((id) => id !== "credentials"),
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignIn = async (provider: string) => {
    setPendingProvider(provider);
    try {
      await signIn(provider, { callbackUrl: callbackUrl ?? "/dashboard" });
    } finally {
      setPendingProvider(null);
    }
  };

  if (availableProviderIds.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">OR</span>
        <div className="bg-border h-px flex-1" />
      </div>
      <div className="flex flex-col gap-2">
        {availableProviderIds.map((providerId) => (
          <Button
            key={providerId}
            type="button"
            variant="outline"
            disabled={pendingProvider !== null}
            onClick={() => handleSignIn(providerId)}
          >
            {pendingProvider === providerId
              ? "Redirecting..."
              : (PROVIDER_LABELS[providerId] ?? `Continue with ${providerId}`)}
          </Button>
        ))}
      </div>
    </>
  );
}
