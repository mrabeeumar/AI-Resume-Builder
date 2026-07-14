import { z } from "zod";

import { parserConfidenceSchema } from "@/types/parser";

// See types/resume-parser.schema.ts for the confidence-attachment rationale;
// the same pattern applies here.

function optionalText(max: number) {
  return z.string().trim().max(max).optional().default("");
}

function stringList(max: number, itemMax = 200) {
  return z.array(z.string().trim().max(itemMax)).max(max).optional().default([]);
}

// See types/resume-parser.schema.ts's `objectWithDefaults` for rationale.
function objectWithDefaults<T extends z.ZodTypeAny>(
  schema: T,
): z.ZodType<z.output<T>> {
  const getDefault = (() => schema.parse({})) as never;
  return schema.optional().default(getDefault) as unknown as z.ZodType<z.output<T>>;
}

export const parsedJobCompanySchema = z.object({
  name: optionalText(200),
  industry: optionalText(120),
  location: optionalText(120),
});
export type ParsedJobCompany = z.infer<typeof parsedJobCompanySchema>;

export const parsedJobPositionSchema = z.object({
  title: optionalText(200),
  department: optionalText(120),
  employmentType: optionalText(60),
  experienceRequired: optionalText(120),
  educationRequired: optionalText(120),
});
export type ParsedJobPosition = z.infer<typeof parsedJobPositionSchema>;

export const parsedJobRequiredSkillsSchema = z.object({
  technical: stringList(40, 60),
  programmingLanguages: stringList(40, 60),
  frameworks: stringList(40, 60),
  tools: stringList(30, 60),
  softSkills: stringList(20, 60),
});
export type ParsedJobRequiredSkills = z.infer<typeof parsedJobRequiredSkillsSchema>;

export const parsedJobTechnologiesSchema = z.object({
  languages: stringList(40, 60),
  frameworks: stringList(40, 60),
  databases: stringList(20, 60),
  cloudPlatforms: stringList(20, 60),
  devopsTools: stringList(20, 60),
  other: stringList(30, 60),
});
export type ParsedJobTechnologies = z.infer<typeof parsedJobTechnologiesSchema>;

// Keywords are ranked by importance (10 = most important) so downstream ATS
// features can prioritize which terms most affect matching.
export const parsedJobKeywordSchema = z.object({
  keyword: z.string().trim().max(60),
  importance: z.number().min(1).max(10),
});
export type ParsedJobKeyword = z.infer<typeof parsedJobKeywordSchema>;

export const parsedJobDescriptionAIOutputSchema = z.object({
  company: objectWithDefaults(parsedJobCompanySchema),
  position: objectWithDefaults(parsedJobPositionSchema),
  responsibilities: stringList(40, 500),
  requiredSkills: objectWithDefaults(parsedJobRequiredSkillsSchema),
  preferredSkills: stringList(30, 200),
  keywords: z.array(parsedJobKeywordSchema).max(50).optional().default([]),
  technologies: objectWithDefaults(parsedJobTechnologiesSchema),
  // Used by the Job Application Workspace (M21) to prefill workspace fields
  // without inventing values — empty string when not present in the posting.
  salary: optionalText(120),
  workMode: optionalText(30),
  applicationDeadline: optionalText(60),
});
export type ParsedJobDescriptionAIOutput = z.infer<
  typeof parsedJobDescriptionAIOutputSchema
>;

export const parsedJobDescriptionSchema = parsedJobDescriptionAIOutputSchema.extend({
  confidence: parserConfidenceSchema,
});
export type ParsedJobDescription = z.infer<typeof parsedJobDescriptionSchema>;
