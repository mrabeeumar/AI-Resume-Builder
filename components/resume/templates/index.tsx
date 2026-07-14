import type { ResumeTemplateId } from "@/lib/enums";

import { ClassicTemplate } from "@/components/resume/templates/classic-template";
import { ModernTemplate } from "@/components/resume/templates/modern-template";
import { MinimalTemplate } from "@/components/resume/templates/minimal-template";
import { ProfessionalTemplate } from "@/components/resume/templates/professional-template";
import { CompactTemplate } from "@/components/resume/templates/compact-template";
import { ExecutiveTemplate } from "@/components/resume/templates/executive-template";
import { TechnicalTemplate } from "@/components/resume/templates/technical-template";
import { TimelineTemplate } from "@/components/resume/templates/timeline-template";
import { ElegantTemplate } from "@/components/resume/templates/elegant-template";
import { BoldTemplate } from "@/components/resume/templates/bold-template";
import { CreativeTemplate } from "@/components/resume/templates/creative-template";
import { AcademicTemplate } from "@/components/resume/templates/academic-template";
import type { ResumeTemplateProps } from "@/components/resume/templates/types";

export const RESUME_TEMPLATE_COMPONENTS: Record<
  ResumeTemplateId,
  (props: ResumeTemplateProps) => React.JSX.Element
> = {
  CLASSIC: ClassicTemplate,
  MODERN: ModernTemplate,
  MINIMAL: MinimalTemplate,
  PROFESSIONAL: ProfessionalTemplate,
  COMPACT: CompactTemplate,
  EXECUTIVE: ExecutiveTemplate,
  TECHNICAL: TechnicalTemplate,
  TIMELINE: TimelineTemplate,
  ELEGANT: ElegantTemplate,
  BOLD: BoldTemplate,
  CREATIVE: CreativeTemplate,
  ACADEMIC: AcademicTemplate,
};

export type { ResumeTemplateProps } from "@/components/resume/templates/types";
