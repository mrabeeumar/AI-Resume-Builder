import { z } from "zod";

// AI-produced portion of an assistant reply. The assistant answers using
// only the resume, review, tailoring, and skill-gap context it is given —
// see .claude/docs/ai.md's hallucination-prevention rule — it never invents
// resume facts and stays scoped to career guidance and explanation.

export const resumeAssistantAIOutputSchema = z.object({
  answer: z.string().trim().min(1).max(4000),
  confidence: z.number().min(0).max(100),
  followUpQuestions: z
    .array(z.string().trim().max(200))
    .max(5)
    .optional()
    .default([]),
});
export type ResumeAssistantAIOutput = z.infer<
  typeof resumeAssistantAIOutputSchema
>;
