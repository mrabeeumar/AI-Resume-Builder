import { z } from "zod";

// AI-produced portion of a tailored resume. The AI may only reword the
// `description` of existing experience/project items (identified by their
// original `id`) and choose which existing skills/certifications to
// surface — it never introduces new ids, skills, companies, or dates. The
// service layer (resume-tailoring.service.ts) enforces this by rejecting
// any id/skill not present in the source resume before persisting.

function optionalText(max: number) {
  return z.string().trim().max(max).optional().default("");
}

function stringList(max: number, itemMax = 200) {
  return z.array(z.string().trim().max(itemMax)).max(max).optional().default([]);
}

const rewrittenItemSchema = z.object({
  id: z.string().trim().min(1).max(100),
  description: optionalText(2000),
});

export const tailoredResumeAIOutputSchema = z.object({
  summary: optionalText(2000),
  experience: z.array(rewrittenItemSchema).max(50).optional().default([]),
  // Ordered subset of the resume's own skill list — order reflects
  // relevance to the target job.
  skills: stringList(100, 60),
  projects: z.array(rewrittenItemSchema).max(50).optional().default([]),
  // Ids of existing certifications worth highlighting for this job.
  highlightedCertificationIds: stringList(50, 100),
  sectionsModified: stringList(10, 60),
  keywordsIncorporated: stringList(30, 60),
  missingSkillsIdentified: stringList(30, 60),
  recommendations: stringList(15, 300),
  overallImprovements: stringList(15, 300),
});
export type TailoredResumeAIOutput = z.infer<typeof tailoredResumeAIOutputSchema>;
