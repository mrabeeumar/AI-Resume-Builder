import {
  SECTION_TYPE_LABELS,
  type ResumeSectionItem,
} from "@/types/resume-section";
import type {
  CertificationsContent,
  EducationContent,
  ExperienceContent,
  PersonalInfoContent,
  ProjectsContent,
  SkillsContent,
  SummaryContent,
} from "@/types/resume-section";

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

export function SectionBody({ section }: { section: ResumeSectionItem }) {
  const heading = SECTION_TYPE_LABELS[section.type];

  switch (section.type) {
    case "SUMMARY": {
      const content = section.content as SummaryContent;
      if (!content.text) return null;
      return (
        <SectionShell heading={heading}>
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
        <SectionShell heading={heading}>
          <div className="flex flex-col gap-3">
            {content.items.map((item) => (
              <div key={item.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-semibold">
                    {[item.role, item.company].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-xs opacity-70">
                    {dateRange(item.startDate, item.endDate, item.current)}
                  </p>
                </div>
                {item.location && (
                  <p className="text-xs opacity-70">{item.location}</p>
                )}
                {item.description && (
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionShell>
      );
    }

    case "EDUCATION": {
      const content = section.content as EducationContent;
      if (content.items.length === 0) return null;
      return (
        <SectionShell heading={heading}>
          <div className="flex flex-col gap-3">
            {content.items.map((item) => (
              <div key={item.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-semibold">
                    {[item.degree, item.fieldOfStudy]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-xs opacity-70">
                    {dateRange(item.startDate, item.endDate, false)}
                  </p>
                </div>
                {item.school && (
                  <p className="text-xs opacity-70">{item.school}</p>
                )}
                {item.description && (
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionShell>
      );
    }

    case "SKILLS": {
      const content = section.content as SkillsContent;
      if (content.items.length === 0) return null;
      return (
        <SectionShell heading={heading}>
          <ul className="flex flex-wrap gap-2 text-sm">
            {content.items.map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-current/20 px-2.5 py-0.5"
              >
                {skill}
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    case "PROJECTS": {
      const content = section.content as ProjectsContent;
      if (content.items.length === 0) return null;
      return (
        <SectionShell heading={heading}>
          <div className="flex flex-col gap-3">
            {content.items.map((item) => (
              <div key={item.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-semibold">{item.name}</p>
                  {item.url && <p className="text-xs opacity-70">{item.url}</p>}
                </div>
                {item.technologies && (
                  <p className="text-xs opacity-70">{item.technologies}</p>
                )}
                {item.description && (
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionShell>
      );
    }

    case "CERTIFICATIONS": {
      const content = section.content as CertificationsContent;
      if (content.items.length === 0) return null;
      return (
        <SectionShell heading={heading}>
          <div className="flex flex-col gap-2">
            {content.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-baseline justify-between gap-x-3"
              >
                <p className="text-sm font-semibold">
                  {[item.name, item.issuer].filter(Boolean).join(" · ")}
                </p>
                {item.date && <p className="text-xs opacity-70">{item.date}</p>}
              </div>
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
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex break-inside-avoid flex-col gap-2">
      <h2 className="text-xs font-bold tracking-widest uppercase opacity-70">
        {heading}
      </h2>
      {children}
    </section>
  );
}
