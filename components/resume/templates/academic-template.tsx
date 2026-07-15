import { PAGE_COLOR_HEX, THEME_COLOR_CLASSES } from "@/lib/resume-templates";
import type { PersonalInfoContent } from "@/types/resume-section";

import { SectionBody } from "@/components/resume/templates/section-content";
import type { ResumeTemplateProps } from "@/components/resume/templates/types";

export function AcademicTemplate({
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
  const content = personalInfo?.content as PersonalInfoContent | undefined;
  const contactLine = content
    ? [content.email, content.phone, content.location, content.website]
        .filter(Boolean)
        .join(" | ")
    : null;
  const variant = { heading: "ruled", itemLayout: "date-rail", skills: "inline-text", theme } as const;

  return (
    <div
      className="flex flex-col gap-5 p-10 font-serif text-slate-900"
      style={{ backgroundColor: PAGE_COLOR_HEX[pageColor] }}
    >
      <header className="flex flex-col gap-1 text-center">
        {(content?.fullName || title) && (
          <h1 className="text-2xl font-bold">{content?.fullName || title}</h1>
        )}
        {contactLine && <p className="text-sm">{contactLine}</p>}
      </header>
      <div className="flex flex-col gap-5">
        {rest.map((section) => (
          <SectionBody key={section.id} section={section} variant={variant} />
        ))}
      </div>
    </div>
  );
}
