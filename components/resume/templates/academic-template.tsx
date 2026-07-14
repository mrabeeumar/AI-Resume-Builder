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
      <div
        className={`flex flex-col gap-5 [&_h2]:border-b [&_h2]:border-inherit [&_h2]:pb-1 [&_h2]:font-serif [&_h2]:text-sm [&_h2]:font-bold [&_h2]:tracking-normal [&_h2]:normal-case [&_h2]:opacity-100 ${theme.border}`}
      >
        {rest.map((section) => (
          <SectionBody key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}
