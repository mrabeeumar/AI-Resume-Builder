import { PAGE_COLOR_HEX, THEME_COLOR_CLASSES } from "@/lib/resume-templates";
import type { PersonalInfoContent } from "@/types/resume-section";

import {
  PersonalInfoHeader,
  SectionBody,
} from "@/components/resume/templates/section-content";
import type { ResumeTemplateProps } from "@/components/resume/templates/types";

export function ModernTemplate({
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
  const variant = { heading: "chip", itemLayout: "inline", skills: "inline-text", theme } as const;

  return (
    <div
      className="flex flex-col text-slate-900"
      style={{ backgroundColor: PAGE_COLOR_HEX[pageColor] }}
    >
      <div className={`px-8 py-6 text-white ${theme.swatch}`}>
        {personalInfo ? (
          <PersonalInfoHeader
            content={personalInfo.content as PersonalInfoContent}
          />
        ) : (
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        )}
      </div>
      <div className="flex flex-col gap-5 p-8">
        {rest.map((section) => (
          <SectionBody key={section.id} section={section} variant={variant} />
        ))}
      </div>
    </div>
  );
}
