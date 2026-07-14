import { z } from "zod";

import { RESUME_SECTION_TYPES, type ResumeSectionType } from "@/lib/enums";

function optionalText(max: number) {
  return z.string().trim().max(max).optional().default("");
}

function optionalEmail() {
  return z
    .string()
    .trim()
    .max(200)
    .optional()
    .default("")
    .refine(
      (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      "Invalid email address",
    );
}

function itemId() {
  return z.string().trim().min(1).max(100);
}

export const personalInfoContentSchema = z.object({
  fullName: optionalText(120),
  email: optionalEmail(),
  phone: optionalText(50),
  location: optionalText(120),
  website: optionalText(200),
});

export const summaryContentSchema = z.object({
  text: optionalText(20000),
});

export const experienceItemSchema = z.object({
  id: itemId(),
  company: optionalText(120),
  role: optionalText(120),
  location: optionalText(120),
  startDate: optionalText(20),
  endDate: optionalText(20),
  current: z.boolean().optional().default(false),
  description: optionalText(2000),
});
export const experienceContentSchema = z.object({
  items: z.array(experienceItemSchema).max(50).optional().default([]),
});

export const educationItemSchema = z.object({
  id: itemId(),
  school: optionalText(120),
  degree: optionalText(120),
  fieldOfStudy: optionalText(120),
  startDate: optionalText(20),
  endDate: optionalText(20),
  description: optionalText(2000),
});
export const educationContentSchema = z.object({
  items: z.array(educationItemSchema).max(50).optional().default([]),
});

export const skillsContentSchema = z.object({
  items: z
    .array(z.string().trim().min(1).max(60))
    .max(100)
    .optional()
    .default([]),
});

export const projectItemSchema = z.object({
  id: itemId(),
  name: optionalText(120),
  description: optionalText(2000),
  url: optionalText(300),
  technologies: optionalText(300),
});
export const projectsContentSchema = z.object({
  items: z.array(projectItemSchema).max(50).optional().default([]),
});

export const certificationItemSchema = z.object({
  id: itemId(),
  name: optionalText(120),
  issuer: optionalText(120),
  date: optionalText(20),
  url: optionalText(300),
});
export const certificationsContentSchema = z.object({
  items: z.array(certificationItemSchema).max(50).optional().default([]),
});

const genericContentSchema = z.record(z.string(), z.unknown());

export const sectionContentSchemas: Record<ResumeSectionType, z.ZodTypeAny> = {
  PERSONAL_INFO: personalInfoContentSchema,
  SUMMARY: summaryContentSchema,
  EXPERIENCE: experienceContentSchema,
  EDUCATION: educationContentSchema,
  SKILLS: skillsContentSchema,
  PROJECTS: projectsContentSchema,
  CERTIFICATIONS: certificationsContentSchema,
  LANGUAGES: genericContentSchema,
  AWARDS: genericContentSchema,
  CUSTOM: genericContentSchema,
};

export function parseSectionContent(type: ResumeSectionType, content: unknown) {
  return sectionContentSchemas[type].parse(content ?? {});
}

export const EDITABLE_SECTION_TYPES = [
  "PERSONAL_INFO",
  "SUMMARY",
  "EXPERIENCE",
  "EDUCATION",
  "SKILLS",
  "PROJECTS",
  "CERTIFICATIONS",
] as const satisfies readonly ResumeSectionType[];

export const SECTION_TYPE_LABELS: Record<ResumeSectionType, string> = {
  PERSONAL_INFO: "Personal Info",
  SUMMARY: "Summary",
  EXPERIENCE: "Experience",
  EDUCATION: "Education",
  SKILLS: "Skills",
  PROJECTS: "Projects",
  CERTIFICATIONS: "Certifications",
  LANGUAGES: "Languages",
  AWARDS: "Awards",
  CUSTOM: "Custom",
};

export const DEFAULT_SECTION_CONTENT: Record<ResumeSectionType, unknown> = {
  PERSONAL_INFO: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
  },
  SUMMARY: { text: "" },
  EXPERIENCE: { items: [] },
  EDUCATION: { items: [] },
  SKILLS: { items: [] },
  PROJECTS: { items: [] },
  CERTIFICATIONS: { items: [] },
  LANGUAGES: {},
  AWARDS: {},
  CUSTOM: {},
};

export const createSectionSchema = z.object({
  type: z.enum(RESUME_SECTION_TYPES),
  content: z.unknown().optional(),
});

export const updateSectionSchema = z
  .object({
    content: z.unknown().optional(),
    hidden: z.boolean().optional(),
  })
  .refine((data) => data.content !== undefined || data.hidden !== undefined, {
    message: "At least one field must be provided",
  });

export const reorderSectionsSchema = z.object({
  order: z.array(z.string().trim().min(1)).min(1),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;

export type PersonalInfoContent = z.infer<typeof personalInfoContentSchema>;
export type SummaryContent = z.infer<typeof summaryContentSchema>;
export type ExperienceContent = z.infer<typeof experienceContentSchema>;
export type EducationContent = z.infer<typeof educationContentSchema>;
export type SkillsContent = z.infer<typeof skillsContentSchema>;
export type ProjectsContent = z.infer<typeof projectsContentSchema>;
export type CertificationsContent = z.infer<typeof certificationsContentSchema>;

export type ResumeSectionItem = {
  id: string;
  resumeId: string;
  type: ResumeSectionType;
  order: number;
  hidden: boolean;
  content: unknown;
  createdAt: Date;
  updatedAt: Date;
};
