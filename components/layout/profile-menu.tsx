"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  CreditCardIcon,
  LogOutIcon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
  UserIcon,
  ZapIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

interface ProfileSummary {
  name: string | null;
  email: string | null;
  plan: string;
  status: string;
  aiUsage: {
    totalCalls: number;
    totalTokens: number;
    windowDays: number;
    limit: number | null;
  };
}

/** Derives up to two uppercase initials from a name, falling back to email. */
function getInitials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ProfileMenu() {
  const { theme, mounted, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [profile, setProfile] = React.useState<ProfileSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  // Fetch on mount so the avatar can show real initials before the menu is
  // ever opened. Aborts on unmount to avoid setState after teardown.
  React.useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch("/api/profile/summary", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to load profile.");
        const data = (await response.json()) as { profile: ProfileSummary };
        setProfile(data.profile);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError(true);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const initials = getInitials(profile?.name ?? null, profile?.email ?? null);
  const displayName = profile?.name ?? "Your account";
  const plan = profile?.plan ?? "FREE";
  const isTeam = plan === "TEAM";

  const usage = profile?.aiUsage;
  const usagePercent =
    usage && usage.limit && usage.limit > 0
      ? Math.min(100, Math.round((usage.totalCalls / usage.limit) * 100))
      : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Open account menu"
          // Form-fill browser extensions (e.g. LastPass) inject attributes
          // like fdprocessedid into buttons after load; ignore that mismatch.
          suppressHydrationWarning
          className={cn(
            "border-input hover:border-primary/40 focus-visible:border-ring focus-visible:ring-ring/50 relative flex size-9 items-center justify-center overflow-hidden rounded-full border transition-colors duration-200 outline-none focus-visible:ring-[3px] active:scale-95",
            "from-primary to-primary/70 text-primary-foreground bg-gradient-to-br",
          )}
        >
          {loading ? (
            <UserIcon className="size-4.5 opacity-90" />
          ) : (
            <span className="font-heading text-xs font-bold tracking-tight">
              {initials}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 p-0 overflow-hidden"
      >
        {/* Identity header */}
        <div className="from-primary/[0.08] to-transparent border-b bg-gradient-to-br p-4">
          <div className="flex items-center gap-3">
            <div className="from-primary to-primary/70 text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br">
              {loading ? (
                <UserIcon className="size-5" />
              ) : (
                <span className="font-heading text-sm font-bold">
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm font-semibold">
                {displayName}
              </p>
              {profile?.email ? (
                <p className="text-muted-foreground truncate text-xs">
                  {profile.email}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col p-2">
          {/* Plan + upgrade */}
          <div className="flex items-center justify-between gap-2 px-2 py-2">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="text-muted-foreground size-4" />
              <span className="text-sm font-medium">Plan</span>
            </div>
            <Badge variant={isTeam ? "success" : "secondary"} className="capitalize">
              {plan.toLowerCase()}
            </Badge>
          </div>

          {!isTeam ? (
            <Link
              href="/dashboard/billing"
              onClick={() => setOpen(false)}
              className="from-primary to-primary/80 text-primary-foreground hover:shadow-primary/30 mx-2 mb-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r px-3 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
            >
              <ZapIcon className="size-4" />
              Upgrade plan
            </Link>
          ) : null}

          {/* AI usage */}
          <div className="mt-1 px-2 py-2">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <SparklesIcon className="text-chart-amber size-4" />
                AI usage
              </span>
              {usage ? (
                <span className="text-muted-foreground text-xs">
                  {usage.limit === null
                    ? "Unlimited"
                    : `${usage.totalCalls}/${usage.limit}`}
                </span>
              ) : null}
            </div>

            {loading ? (
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Spinner className="size-3" />
                Loading…
              </div>
            ) : error ? (
              <p className="text-muted-foreground text-xs">
                Couldn&apos;t load usage.
              </p>
            ) : usage ? (
              <>
                {usagePercent !== null ? (
                  <div
                    className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
                    role="progressbar"
                    aria-valuenow={usagePercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="AI calls used this month"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        usagePercent >= 100
                          ? "bg-destructive"
                          : usagePercent >= 80
                            ? "bg-warning"
                            : "bg-primary",
                      )}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                ) : null}
                <p className="text-muted-foreground mt-1.5 text-xs">
                  {usage.totalCalls} calls &middot;{" "}
                  {usage.totalTokens.toLocaleString()} tokens · last{" "}
                  {usage.windowDays} days
                </p>
              </>
            ) : null}
          </div>

          {/* Theme */}
          <div className="mt-1 px-2 py-2">
            <span className="mb-1.5 block text-sm font-medium">Theme</span>
            <div className="bg-muted/60 flex gap-1 rounded-lg p-1">
              <ThemeOption
                icon={<SunIcon className="size-4" />}
                label="Light"
                active={mounted && theme === "light"}
                onClick={() => setTheme("light")}
              />
              <ThemeOption
                icon={<MoonIcon className="size-4" />}
                label="Dark"
                active={mounted && theme === "dark"}
                onClick={() => setTheme("dark")}
              />
            </div>
          </div>

          <div className="my-1 border-t" />

          {/* Links */}
          <MenuLink
            href="/dashboard/billing"
            icon={<CreditCardIcon className="size-4" />}
            label="Billing"
            onNavigate={() => setOpen(false)}
          />

          <button
            type="button"
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              signOut({ callbackUrl: "/login" });
            }}
            className="text-destructive hover:bg-destructive/10 flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors disabled:opacity-60"
          >
            <LogOutIcon className="size-4" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ThemeOption({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="text-foreground hover:bg-accent flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}

export { ProfileMenu };
