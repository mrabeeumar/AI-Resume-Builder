"use client";

import * as React from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

// The source of truth for the theme is the `dark` class on <html>, applied
// before hydration by the inline script in the root layout. We subscribe to
// it with useSyncExternalStore so there is no flash and no setState-in-effect.

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  applyTheme(event.newValue === "dark" ? "dark" : "light");
  emit();
}

function subscribe(callback: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener("storage", onStorage);
  }
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** The theme is unknown during SSR; default to light to match first paint. */
function getServerSnapshot(): Theme {
  return "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function persist(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures (e.g. private mode); theme still applies.
  }
}

export type UseThemeResult = {
  theme: Theme;
  /** False during SSR and until the client mounts; the real theme is unknown. */
  mounted: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

/**
 * Reads and controls the active color theme. No provider is required — the
 * theme lives on the <html> element and is shared across every consumer.
 */
function useTheme(): UseThemeResult {
  const theme = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const mounted = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const setTheme = React.useCallback((next: Theme) => {
    applyTheme(next);
    persist(next);
    emit();
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(getSnapshot() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, mounted, setTheme, toggleTheme };
}

export { useTheme };
