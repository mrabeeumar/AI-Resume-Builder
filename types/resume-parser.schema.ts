import { z } from "zod";

import { parserConfidenceSchema } from "@/types/parser";

// Schemas in this file describe the AI-produced portion of a parsed resume
// (the shape requested from `generateAIJSON`). Confidence is computed
// separately and deterministically by the service layer — see
// `services/resume-parser.service.ts` — and is attached afterwards, which is
// why it is not part of `parsedResumeAIOutputSchema`.

function optionalText(max: number) {
  return z.string().trim().max(max).optional().default("");
}

function stringList(max: number, itemMax = 200) {
  return z.array(z.string().trim().max(itemMax)).max(max).optional().default([]);
}

// Nested "section object" fields (personalInfo, summary, skills) must
// default to a fully-populated object — not `{}` — when the AI response
// omits them entirely, since every field they contain is read directly by
// the normalization/confidence logic downstream.
function objectWithDefaults<T extends z.ZodTypeAny>(
  schema: T,
): z.ZodType<z.output<T>> {
  const getDefault = (() => schema.parse({})) as never;
  return schema.optional().default(getDefault) as unknown as z.ZodType<z.output<T>>;
}

export const parsedPersonalInfoSchema = z.object({
  name: optionalText(120),
  email: optionalText(200),
  phone: optionalText(50),
  location: optionalText(120),
  linkedin: optionalText(300),
  portfolio: optionalText(300),
  github: optionalText(300),
});
export type ParsedPersonalInfo = z.infer<typeof parsedPersonalInfoSchema>;

export const parsedSummarySchema = z.object({
  summary: optionalText(2000),
  careerObjective: optionalText(1000),
});
export type ParsedSummary = z.infer<typeof parsedSummarySchema>;

export const parsedExperienceItemSchema = z.object({
  company: optionalText(120),
  position: optionalText(120),
  employmentType: optionalText(60),
  startDate: optionalText(20),
  endDate: optionalText(20),
  current: z.boolean().optional().default(false),
  location: optionalText(120),
  responsibilities: stringList(30, 500),
  achievements: stringList(30, 500),
  technologiesUsed: stringList(50, 60),
});
export type ParsedExperience = z.infer<typeof parsedExperienceItemSchema>;

export const parsedProjectItemSchema = z.object({
  name: optionalText(120),
  description: optionalText(2000),
  technologies: stringList(50, 60),
  role: optionalText(120),
  outcomes: stringList(20, 500),
  links: stringList(10, 300),
});
export type ParsedProject = z.infer<typeof parsedProjectItemSchema>;

export const parsedEducationItemSchema = z.object({
  institution: optionalText(120),
  degree: optionalText(120),
  field: optionalText(120),
  gpa: optionalText(20),
  startDate: optionalText(20),
  endDate: optionalText(20),
});
export type ParsedEducation = z.infer<typeof parsedEducationItemSchema>;

export const parsedSkillsSchema = z.object({
  programmingLanguages: stringList(40, 60),
  frameworks: stringList(40, 60),
  libraries: stringList(40, 60),
  databases: stringList(20, 60),
  cloud: stringList(20, 60),
  tools: stringList(30, 60),
  softSkills: stringList(20, 60),
  other: stringList(30, 60),
});
export type ParsedSkill = z.infer<typeof parsedSkillsSchema>;

export const parsedCertificationItemSchema = z.object({
  name: optionalText(150),
  organization: optionalText(120),
  date: optionalText(20),
  credentialUrl: optionalText(300),
});
export type ParsedCertification = z.infer<typeof parsedCertificationItemSchema>;

export const parsedLanguageItemSchema = z.object({
  language: optionalText(60),
  proficiency: optionalText(60),
});
export type ParsedLanguage = z.infer<typeof parsedLanguageItemSchema>;

export const parsedResumeAIOutputSchema = z.object({
  personalInfo: objectWithDefaults(parsedPersonalInfoSchema),
  summary: objectWithDefaults(parsedSummarySchema),
  experience: z.array(parsedExperienceItemSchema).max(30).optional().default([]),
  projects: z.array(parsedProjectItemSchema).max(30).optional().default([]),
  education: z.array(parsedEducationItemSchema).max(20).optional().default([]),
  skills: objectWithDefaults(parsedSkillsSchema),
  certifications: z
    .array(parsedCertificationItemSchema)
    .max(30)
    .optional()
    .default([]),
  languages: z.array(parsedLanguageItemSchema).max(20).optional().default([]),
});
export type ParsedResumeAIOutput = z.infer<typeof parsedResumeAIOutputSchema>;

export const parsedResumeSchema = parsedResumeAIOutputSchema.extend({
  confidence: parserConfidenceSchema,
});
export type ParsedResume = z.infer<typeof parsedResumeSchema>;
