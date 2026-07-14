import { PAGE_COLOR_HEX, THEME_COLOR_CLASSES } from "@/lib/resume-templates";
import type { PersonalInfoContent } from "@/types/resume-section";

import {
  PersonalInfoHeader,
  SectionBody,
} from "@/components/resume/templates/section-content";
import type { ResumeTemplateProps } from "@/components/resume/templates/types";

export function MinimalTemplate({
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

  return (
    <div
      className="flex flex-col gap-6 p-10 text-slate-800"
      style={{ backgroundColor: PAGE_COLOR_HEX[pageColor] }}
    >
      <div className={`border-b pb-4 ${theme.border}`}>
        {personalInfo ? (
          <PersonalInfoHeader
            content={personalInfo.content as PersonalInfoContent}
          />
        ) : (
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        )}
      </div>
      <div className="flex flex-col gap-6">
        {rest.map((section) => (
          <SectionBody key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
