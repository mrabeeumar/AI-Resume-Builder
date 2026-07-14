"use client";

import { MoonIcon, SunIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";

type ThemeToggleProps = {
  className?: string;
};

/**
 * Icon button that switches between light and dark themes. Renders both icons
 * and cross-fades them so the control stays visually stable while toggling.
 */
function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, mounted, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      // Until mounted we don't know the real theme; hide state to avoid a
      // hydration mismatch, but keep the button interactive.
      aria-pressed={mounted ? isDark : undefined}
      // Form-fill browser extensions (e.g. LastPass) inject attributes like
      // fdprocessedid into buttons after load; ignore that specific mismatch.
      suppressHydrationWarning
      className={cn(
        "border-input hover:bg-accent hover:text-accent-foreground hover:border-primary/40 focus-visible:border-ring focus-visible:ring-ring/50 relative flex size-9 items-center justify-center rounded-lg border transition-colors duration-200 outline-none focus-visible:ring-[3px] active:scale-95",
        className,
      )}
    >
      <SunIcon
        className={cn(
          "size-4.5 transition-all duration-300",
          mounted && isDark
            ? "scale-0 -rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100",
        )}
      />
      <MoonIcon
        className={cn(
          "absolute size-4.5 transition-all duration-300",
          mounted && isDark
            ? "scale-100 rotate-0 opacity-100"
            : "scale-0 rotate-90 opacity-0",
        )}
      />
    </button>
  );
}

export { ThemeToggle };
