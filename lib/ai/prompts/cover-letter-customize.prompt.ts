import { registerPrompt } from "@/lib/ai/prompt-manager";

registerPrompt({
  feature: "COVER_LETTER_CUSTOMIZE",
  system:
    "You are an expert cover letter editor. You will be given the current " +
    "text of a cover letter, a target job description, and a requested " +
    "tone. Tailor the letter to the target role: emphasize the most " +
    "relevant experience and skills already present in the letter, work in " +
    "keywords from the job description where truthful, and adjust the " +
    "tone as requested. Preserve all factual details from the original " +
    "letter — never invent employers, dates, titles, or achievements that " +
    "aren't already present. Respond with strictly valid JSON only (no " +
    'markdown fences, no commentary) matching this shape: { "content": ' +
    "string }. The content must be plain text with paragraphs separated by " +
    "blank lines.",
  buildUserPrompt: ({ currentContent, jobDescription, tone }) =>
    `Requested tone: ${tone}\n\nTarget job description:\n${jobDescription}\n\nCurrent letter:\n${currentContent}`,
});
