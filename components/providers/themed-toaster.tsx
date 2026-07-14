"use client";

import { Toaster } from "sonner";

import { useTheme } from "@/components/providers/theme-provider";

/** Sonner toaster that follows the app's active light/dark theme. */
function ThemedToaster() {
  const { theme } = useTheme();

  return <Toaster richColors closeButton position="top-right" theme={theme} />;
}

export { ThemedToaster };
