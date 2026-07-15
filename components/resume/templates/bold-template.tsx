import { PAGE_COLOR_HEX, THEME_COLOR_CLASSES } from "@/lib/resume-templates";
import type { PersonalInfoContent } from "@/types/resume-section";

import { SectionBody } from "@/components/resume/templates/section-content";
import type { ResumeTemplateProps } from "@/components/resume/templates/types";

export function BoldTemplate({
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
  const variant = {
    heading: "chip",
    itemLayout: "compact",
    skills: "pills",
    skillsFilled: true,
    theme,
  } as const;

  return (
    <div
      className="flex flex-col text-slate-900"
      style={{ backgroundColor: PAGE_COLOR_HEX[pageColor] }}
    >
      <header
        className={`flex flex-col gap-1 p-8 text-white ${theme.swatch}`}
      >
        {(content?.fullName || title) && (
          <h1 className="text-4xl font-black tracking-tight uppercase">
            {content?.fullName || title}
          </h1>
        )}
        {contactLine && <p className="text-sm opacity-90">{contactLine}</p>}
      </header>
      <div className="flex flex-col gap-5 p-8">
        {rest.map((section) => (
          <div
            key={section.id}
            className={`border-b pb-4 last:border-b-0 last:pb-0 ${theme.border}`}
          >
            <SectionBody section={section} variant={variant} />
          </div>
        ))}
      </div>
    </div>
  );
}
