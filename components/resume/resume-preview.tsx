import type {
  PageSize,
  ResumePageColor,
  ResumeTemplateId,
  ResumeThemeColor,
} from "@/lib/enums";
import { RESUME_TEMPLATE_COMPONENTS } from "@/components/resume/templates";
import { PAGE_SIZE_WIDTH_PX } from "@/lib/resume-templates";
import type { ResumeSectionItem } from "@/types/resume-section";

type Props = {
  title: string;
  sections: ResumeSectionItem[];
  templateId: ResumeTemplateId;
  themeColor: ResumeThemeColor;
  pageColor: ResumePageColor;
  pageSize: PageSize;
};

export function ResumePreview({
  title,
  sections,
  templateId,
  themeColor,
  pageColor,
  pageSize,
}: Props) {
  const Template = RESUME_TEMPLATE_COMPONENTS[templateId];

  return (
    <div
      className="resume-preview border-border mx-auto overflow-hidden rounded-md border shadow-sm print:overflow-visible print:rounded-none print:border-0 print:shadow-none"
      style={{ maxWidth: PAGE_SIZE_WIDTH_PX[pageSize] }}
    >
      <Template
        title={title}
        sections={sections}
        themeColor={themeColor}
        pageColor={pageColor}
      />
    </div>
  );
}
