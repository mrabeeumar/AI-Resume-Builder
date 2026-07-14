import { registerPrompt } from "@/lib/ai/prompt-manager";

registerPrompt({
  feature: "KEYWORD_EXTRACTION",
  system:
    "You are an ATS keyword optimization expert. You will be given a " +
    "target job description and a summary of a candidate's current " +
    "resume content (skills and experience). Identify important keywords " +
    "and skills from the job description that are missing from the " +
    "resume, and give short, actionable suggestions for where/how to " +
    "naturally add them. Respond with strictly valid JSON only (no " +
    'markdown fences, no commentary) matching this shape: { ' +
    '"missingKeywords": string[], "suggestions": string[] }. Do not ' +
    "suggest keyword stuffing; every suggestion must remain truthful to " +
    "the candidate's actual background.",
  buildUserPrompt: ({ jobDescription, resumeSummary }) =>
    `Job description:\n${jobDescription}\n\nCurrent resume content:\n${resumeSummary}`,
});
