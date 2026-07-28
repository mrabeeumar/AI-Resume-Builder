import {
  getSectionHeading,
  type ResumeSectionItem,
} from "@/types/resume-section";
import type {
  CertificationsContent,
  CustomContent,
  EducationContent,
  ExperienceContent,
  PersonalInfoContent,
  ProjectsContent,
  SkillsContent,
  SummaryContent,
} from "@/types/resume-section";

type ThemeClasses = { text: string; border: string; bg: string; swatch: string };

export type SectionHeadingVariant =
  | "ruled"
  | "rail"
  | "chip"
  | "center-serif"
  | "mono-bracket";

export type SectionItemLayout = "inline" | "stacked" | "date-rail" | "compact";

export type SectionSkillsVariant =
  | "pills"
  | "inline-text"
  | "tags-underline"
  | "bracket";

export type SectionVariant = {
  heading?: SectionHeadingVariant;
  itemLayout?: SectionItemLayout;
  skills?: SectionSkillsVariant;
  skillsFilled?: boolean;
  theme?: ThemeClasses;
};

function dateRange(startDate: string, endDate: string, current: boolean) {
  const end = current ? "Present" : endDate;
  if (!startDate && !end) return null;
  return [startDate, end].filter(Boolean).join(" — ");
}

export function PersonalInfoHeader({
  content,
}: {
  content: PersonalInfoContent;
}) {
  const contactLine = [
    content.email,
    content.phone,
    content.location,
    content.website,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="flex flex-col gap-1">
      {content.fullName && (
        <h1 className="text-3xl font-bold tracking-tight">
          {content.fullName}
        </h1>
      )}
      {contactLine && <p className="text-sm opacity-80">{contactLine}</p>}
    </header>
  );
}

export function SectionBody({
  section,
  variant,
}: {
  section: ResumeSectionItem;
  variant?: SectionVariant;
}) {
  const heading = getSectionHeading(section);
  const itemLayout = variant?.itemLayout ?? "inline";
  const theme = variant?.theme;

  switch (section.type) {
    case "SUMMARY": {
      const content = section.content as SummaryContent;
      if (!content.text) return null;
      return (
        <SectionShell heading={heading} variant={variant}>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {content.text}
          </p>
        </SectionShell>
      );
    }

    case "EXPERIENCE": {
      const content = section.content as ExperienceContent;
      if (content.items.length === 0) return null;
      return (
        <SectionShell heading={heading} variant={variant}>
          <div className="flex flex-col gap-3">
            {content.items.map((item) => (
              <ItemRow
                key={item.id}
                layout={itemLayout}
                theme={theme}
                title={[item.role, item.company].filter(Boolean).join(" · ")}
                meta={item.location}
                date={dateRange(item.startDate, item.endDate, item.current)}
                description={item.description}
              />
            ))}
          </div>
        </SectionShell>
      );
    }

    case "EDUCATION": {
      const content = section.content as EducationContent;
      if (content.items.length === 0) return null;
      return (
        <SectionShell heading={heading} variant={variant}>
          <div className="flex flex-col gap-3">
            {content.items.map((item) => (
              <ItemRow
                key={item.id}
                layout={itemLayout}
                theme={theme}
                title={[item.degree, item.fieldOfStudy]
                  .filter(Boolean)
                  .join(", ")}
                meta={item.school}
                date={dateRange(item.startDate, item.endDate, false)}
                description={item.description}
              />
            ))}
          </div>
        </SectionShell>
      );
    }

    case "SKILLS": {
      const content = section.content as SkillsContent;
      if (content.items.length === 0) return null;
      return (
        <SectionShell heading={heading} variant={variant}>
          <SkillsList
            items={content.items}
            variant={variant?.skills ?? "pills"}
            filled={variant?.skillsFilled}
            theme={theme}
          />
        </SectionShell>
      );
    }

    case "PROJECTS": {
      const content = section.content as ProjectsContent;
      if (content.items.length === 0) return null;
      return (
        <SectionShell heading={heading} variant={variant}>
          <div className="flex flex-col gap-3">
            {content.items.map((item) => (
              <ItemRow
                key={item.id}
                layout={itemLayout}
                theme={theme}
                title={item.name}
                meta={item.technologies}
                date={item.url}
                description={item.description}
              />
            ))}
          </div>
        </SectionShell>
      );
    }

    case "CERTIFICATIONS": {
      const content = section.content as CertificationsContent;
      if (content.items.length === 0) return null;
      return (
        <SectionShell heading={heading} variant={variant}>
          <div className="flex flex-col gap-2">
            {content.items.map((item) => (
              <ItemRow
                key={item.id}
                layout={itemLayout === "date-rail" ? "date-rail" : "compact"}
                theme={theme}
                title={[item.name, item.issuer].filter(Boolean).join(" · ")}
                meta={null}
                date={item.date}
                description={null}
              />
            ))}
          </div>
        </SectionShell>
      );
    }

    case "CUSTOM": {
      const content = section.content as CustomContent;
      if (content.items.length === 0) return null;
      return (
        <SectionShell heading={heading} variant={variant}>
          <div className="flex flex-col gap-3">
            {content.items.map((item) => (
              <ItemRow
                key={item.id}
                layout={itemLayout}
                theme={theme}
                title={item.title}
                meta={item.subtitle}
                date={item.date}
                description={item.description}
              />
            ))}
          </div>
        </SectionShell>
      );
    }

    default:
      return null;
  }
}

function SectionShell({
  heading,
  variant,
  children,
}: {
  heading: string;
  variant?: SectionVariant;
  children: React.ReactNode;
}) {
  return (
    <section className="flex break-inside-avoid flex-col gap-2">
      <SectionHeading text={heading} variant={variant} />
      {children}
    </section>
  );
}

function SectionHeading({
  text,
  variant,
}: {
  text: string;
  variant?: SectionVariant;
}) {
  const style = variant?.heading ?? "ruled";
  const theme = variant?.theme;

  switch (style) {
    case "rail":
      return (
        <h2
          className={`border-l-2 pl-2 text-xs font-bold tracking-wide uppercase ${theme?.border ?? "border-current/40"}`}
        >
          {text}
        </h2>
      );
    case "chip":
      return (
        <h2
          className={`inline-block w-fit rounded px-2 py-0.5 text-xs font-bold tracking-wide uppercase ${theme?.bg ?? "bg-current/10"} ${theme?.text ?? ""}`}
        >
          {text}
        </h2>
      );
    case "center-serif":
      return (
        <h2 className="text-center font-serif text-sm tracking-[0.2em] uppercase opacity-80">
          {text}
        </h2>
      );
    case "mono-bracket":
      return (
        <h2 className="font-mono text-xs font-bold tracking-wide uppercase opacity-70">
          {"// "}
          {text}
        </h2>
      );
    case "ruled":
    default:
      return (
        <h2 className="border-b border-current/20 pb-1 text-xs font-bold tracking-widest uppercase opacity-70">
          {text}
        </h2>
      );
  }
}

function ItemRow({
  layout,
  title,
  meta,
  date,
  description,
  theme,
}: {
  layout: SectionItemLayout;
  title: string;
  meta?: string | null;
  date?: string | null;
  description?: string | null;
  theme?: ThemeClasses;
}) {
  switch (layout) {
    case "stacked":
      return (
        <div>
          {title && <p className="text-sm font-semibold">{title}</p>}
          {(meta || date) && (
            <p className="text-xs opacity-70">
              {[meta, date].filter(Boolean).join(" · ")}
            </p>
          )}
          {description && (
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">
              {description}
            </p>
          )}
        </div>
      );

    case "date-rail":
      return (
        <div className="grid grid-cols-[64px_1fr] gap-3">
          <p className="pt-0.5 text-[11px] leading-tight opacity-60">
            {date}
          </p>
          <div className="relative border-l border-current/20 pl-4">
            <span
              className={`absolute top-1.5 -left-[4px] size-[7px] rounded-full ${theme?.swatch ?? "bg-current"}`}
            />
            {title && <p className="text-sm font-semibold">{title}</p>}
            {meta && <p className="text-xs opacity-70">{meta}</p>}
            {description && (
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">
                {description}
              </p>
            )}
          </div>
        </div>
      );

    case "compact":
      return (
        <div>
          <p className="text-xs leading-snug">
            {title && <span className="font-semibold">{title}</span>}
            {meta && <span className="opacity-70"> · {meta}</span>}
            {date && <span className="opacity-60"> — {date}</span>}
          </p>
          {description && (
            <p className="text-xs leading-snug opacity-90 whitespace-pre-line">
              {description}
            </p>
          )}
        </div>
      );

    case "inline":
    default:
      return (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            {title && <p className="text-sm font-semibold">{title}</p>}
            {date && <p className="text-xs opacity-70">{date}</p>}
          </div>
          {meta && <p className="text-xs opacity-70">{meta}</p>}
          {description && (
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">
              {description}
            </p>
          )}
        </div>
      );
  }
}

function SkillsList({
  items,
  variant,
  filled,
  theme,
}: {
  items: string[];
  variant: SectionSkillsVariant;
  filled?: boolean;
  theme?: ThemeClasses;
}) {
  switch (variant) {
    case "inline-text":
      return (
        <p className="text-sm leading-relaxed opacity-90">
          {items.join(" · ")}
        </p>
      );

    case "tags-underline":
      return (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {items.map((skill) => (
            <li key={skill} className="border-b border-current/30 pb-0.5">
              {skill}
            </li>
          ))}
        </ul>
      );

    case "bracket":
      return (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs">
          {items.map((skill) => (
            <li key={skill}>[{skill}]</li>
          ))}
        </ul>
      );

    case "pills":
    default:
      return (
        <ul className="flex flex-wrap gap-2 text-sm">
          {items.map((skill) => (
            <li
              key={skill}
              className={
                filled
                  ? `rounded-full px-2.5 py-0.5 text-white ${theme?.swatch ?? "bg-current"}`
                  : "rounded-full border border-current/20 px-2.5 py-0.5"
              }
            >
              {skill}
            </li>
          ))}
        </ul>
      );
  }
}
