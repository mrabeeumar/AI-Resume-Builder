import { PAGE_COLOR_HEX, THEME_COLOR_CLASSES } from "@/lib/resume-templates";
import type { PersonalInfoContent } from "@/types/resume-section";

import {
  PersonalInfoHeader,
  SectionBody,
} from "@/components/resume/templates/section-content";
import type { ResumeTemplateProps } from "@/components/resume/templates/types";

export function CompactTemplate({
  title,
  sections,
  themeColor,
  pageColor,
}: ResumeTemplateProps) {
  const visible = sections.filter((section) => !section.hidden);
  const personalInfo = visible.find(
    (section) => section.type === "PERSONAL_INFO",
  );
  const rest = visible.filter((section) => section.type !== "PERSONAL_INFO");
  const theme = THEME_COLOR_CLASSES[themeColor];
  const variant = { heading: "ruled", itemLayout: "compact", skills: "inline-text", theme } as const;

  return (
    <div
      className="flex flex-col gap-3 p-6 text-sm text-slate-900"
      style={{ backgroundColor: PAGE_COLOR_HEX[pageColor] }}
    >
      <div className={`border-b pb-2 ${theme.border}`}>
        {personalInfo ? (
          <PersonalInfoHeader
            content={personalInfo.content as PersonalInfoContent}
          />
        ) : (
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        )}
      </div>
      <div className="flex flex-col gap-3 [&_h2]:text-[11px] [&_p]:text-xs">
        {rest.map((section) => (
          <SectionBody key={section.id} section={section} variant={variant} />
        ))}
      </div>
    </div>
  );
}
