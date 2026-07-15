import { PAGE_COLOR_HEX, THEME_COLOR_CLASSES } from "@/lib/resume-templates";
import type { PersonalInfoContent } from "@/types/resume-section";

import { SectionBody } from "@/components/resume/templates/section-content";
import type { ResumeTemplateProps } from "@/components/resume/templates/types";

export function ProfessionalTemplate({
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
        .join(" · ")
    : null;
  const variant = { heading: "ruled", itemLayout: "inline", skills: "tags-underline", theme } as const;

  return (
    <div
      className="flex flex-col gap-5 p-8 text-slate-900"
      style={{ backgroundColor: PAGE_COLOR_HEX[pageColor] }}
    >
      <header
        className={`flex flex-col items-center gap-1 border-t-4 border-b pb-4 text-center ${theme.border}`}
      >
        <h1 className="text-3xl font-bold tracking-wide uppercase">
          {content?.fullName || title}
        </h1>
        {contactLine && <p className="text-sm opacity-80">{contactLine}</p>}
      </header>
      <div className="flex flex-col gap-5">
        {rest.map((section) => (
          <SectionBody key={section.id} section={section} variant={variant} />
        ))}
      </div>
    </div>
  );
}
