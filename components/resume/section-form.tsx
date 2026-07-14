import type { ResumeSectionType } from "@/lib/enums";
import { CertificationsForm } from "@/components/resume/section-forms/certifications-form";
import { EducationForm } from "@/components/resume/section-forms/education-form";
import { ExperienceForm } from "@/components/resume/section-forms/experience-form";
import { PersonalInfoForm } from "@/components/resume/section-forms/personal-info-form";
import { ProjectsForm } from "@/components/resume/section-forms/projects-form";
import { SkillsForm } from "@/components/resume/section-forms/skills-form";
import { SummaryForm } from "@/components/resume/section-forms/summary-form";
import type {
  CertificationsContent,
  EducationContent,
  ExperienceContent,
  PersonalInfoContent,
  ProjectsContent,
  SkillsContent,
  SummaryContent,
} from "@/types/resume-section";

type Props = {
  type: ResumeSectionType;
  content: unknown;
  onChange: (content: unknown) => void;
};

export function SectionForm({ type, content, onChange }: Props) {
  switch (type) {
    case "PERSONAL_INFO":
      return (
        <PersonalInfoForm
          content={content as PersonalInfoContent}
          onChange={onChange}
        />
      );
    case "SUMMARY":
      return (
        <SummaryForm content={content as SummaryContent} onChange={onChange} />
      );
    case "EXPERIENCE":
      return (
        <ExperienceForm
          content={content as ExperienceContent}
          onChange={onChange}
        />
      );
    case "EDUCATION":
      return (
        <EducationForm
          content={content as EducationContent}
          onChange={onChange}
        />
      );
    case "SKILLS":
      return (
        <SkillsForm content={content as SkillsContent} onChange={onChange} />
      );
    case "PROJECTS":
      return (
        <ProjectsForm
          content={content as ProjectsContent}
          onChange={onChange}
        />
      );
    case "CERTIFICATIONS":
      return (
        <CertificationsForm
          content={content as CertificationsContent}
          onChange={onChange}
        />
      );
    default:
      return (
        <p className="text-muted-foreground text-sm">
          This section type isn&apos;t editable yet.
        </p>
      );
  }
}
