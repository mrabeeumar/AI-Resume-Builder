"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  FileText,
  MessageCircle,
  MessagesSquare,
  PenSquare,
  Puzzle,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = { resumeId: string };

type Tab = { href: string; label: string; icon: LucideIcon };

function buildTabs(resumeId: string): Tab[] {
  const base = `/dashboard/resumes/${resumeId}`;
  return [
    { href: base, label: "Editor", icon: PenSquare },
    { href: `${base}/ats-report`, label: "ATS report", icon: FileText },
    { href: `${base}/tailor`, label: "Tailor", icon: Target },
    { href: `${base}/review`, label: "Review", icon: ClipboardCheck },
    { href: `${base}/skill-gap`, label: "Skill gap", icon: Puzzle },
    { href: `${base}/assistant`, label: "Assistant", icon: MessageCircle },
    {
      href: `${base}/interview`,
      label: "Interview prep",
      icon: MessagesSquare,
    },
  ];
}

// Secondary navigation for the resume workspace: the editor plus every
// AI-powered sibling tool (ATS report, tailoring, review, skill gap,
// assistant, interview prep). Keeping these as a single pill-tab row instead
// of loose header buttons is what makes the growing tool set scale.
export function WorkspaceTabs({ resumeId }: Props) {
  const pathname = usePathname();
  const tabs = buildTabs(resumeId);

  return (
    <nav
      aria-label="Resume workspace"
      className="mask-fade-x -mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
