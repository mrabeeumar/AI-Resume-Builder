import type { ResumePageColor, ResumeThemeColor } from "@/lib/enums";
import type { ResumeSectionItem } from "@/types/resume-section";

export type ResumeTemplateProps = {
  title: string;
  sections: ResumeSectionItem[];
  themeColor: ResumeThemeColor;
  pageColor: ResumePageColor;
};
