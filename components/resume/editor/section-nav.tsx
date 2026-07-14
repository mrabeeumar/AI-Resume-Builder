"use client";

import { ChevronDown, ChevronUp, EyeOff, Loader2 } from "lucide-react";
import {
  AlignLeft,
  Award,
  Briefcase,
  FileText,
  FolderKanban,
  GraduationCap,
  Languages,
  Trophy,
  UserRound,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useResumeEditor } from "@/components/resume/editor/resume-editor-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ResumeSectionType } from "@/lib/enums";
import { cn } from "@/lib/utils";
import { SECTION_TYPE_LABELS } from "@/types/resume-section";

const SECTION_ICONS: Record<ResumeSectionType, LucideIcon> = {
  PERSONAL_INFO: UserRound,
  SUMMARY: AlignLeft,
  EXPERIENCE: Briefcase,
  EDUCATION: GraduationCap,
  SKILLS: Wrench,
  PROJECTS: FolderKanban,
  CERTIFICATIONS: Award,
  LANGUAGES: Languages,
  AWARDS: Trophy,
  CUSTOM: FileText,
};

export function SectionNav() {
  const {
    sections,
    activeSectionId,
    availableTypes,
    addingType,
    selectSection,
    addSection,
    moveSection,
  } = useResumeEditor();

  const visibleCount = sections.filter((section) => !section.hidden).length;

  return (
    <Card className="gap-0 p-3">
      <div className="flex items-center justify-between px-2 pb-3">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Sections
        </p>
        {sections.length > 0 && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {visibleCount}/{sections.length} shown
          </span>
        )}
      </div>

      {sections.length === 0 ? (
        <p className="text-muted-foreground px-2 py-3 text-sm">
          No sections yet. Add one below to start building your resume.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {sections.map((section, index) => {
            const isActive = section.id === activeSectionId;
            const Icon = SECTION_ICONS[section.type];
            return (
              <li key={section.id} className="group relative">
                {isActive && (
                  <span className="bg-primary absolute top-1/2 left-0 h-4/5 w-0.5 -translate-y-1/2 rounded-full" />
                )}
                <button
                  type="button"
                  onClick={() => selectSection(section.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg py-2 pr-14 pl-2.5 text-left text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md",
                      isActive ? "bg-primary/15" : "bg-muted",
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="truncate">
                    {SECTION_TYPE_LABELS[section.type]}
                  </span>
                  {section.hidden && (
                    <EyeOff className="text-muted-foreground size-3.5 shrink-0" />
                  )}
                </button>
                <span
                  className={cn(
                    "absolute top-1/2 right-1 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100",
                    isActive && "opacity-100",
                  )}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={index === 0}
                    aria-label={`Move ${SECTION_TYPE_LABELS[section.type]} up`}
                    onClick={() => moveSection(section.id, "up")}
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={index === sections.length - 1}
                    aria-label={`Move ${SECTION_TYPE_LABELS[section.type]} down`}
                    onClick={() => moveSection(section.id, "down")}
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {availableTypes.length > 0 && (
        <div className="border-border mt-3 flex flex-col gap-1 border-t pt-3">
          <p className="text-muted-foreground px-2 pb-1 text-xs font-semibold tracking-wide uppercase">
            Add section
          </p>
          {availableTypes.map((type) => {
            const Icon = SECTION_ICONS[type];
            const isAdding = addingType === type;
            return (
              <Button
                key={type}
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground justify-start"
                disabled={isAdding}
                onClick={() => addSection(type)}
              >
                {isAdding ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Icon className="size-3.5" />
                )}
                {isAdding ? "Adding..." : SECTION_TYPE_LABELS[type]}
              </Button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
