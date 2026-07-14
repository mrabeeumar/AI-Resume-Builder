import { registerPrompt } from "@/lib/ai/prompt-manager";

registerPrompt({
  feature: "COVER_LETTER_GENERATION",
  system:
    "You are an expert cover letter writer. You will be given a " +
    "candidate's background, an optional target job description, and a " +
    "requested tone. Write a complete, ready-to-send cover letter (opening, " +
    "2-3 body paragraphs, closing) grounded only in the background " +
    "provided — never invent employers, dates, titles, or achievements. If " +
    "a job description is provided, tailor the letter to the role and " +
    "highlight the most relevant experience and keywords. Respond with " +
    'strictly valid JSON only (no markdown fences, no commentary) matching ' +
    'this shape: { "content": string }. The content must be plain text ' +
    "with paragraphs separated by blank lines, with no placeholder " +
    "brackets like [Company Name] left unfilled — omit details that " +
    "weren't provided rather than inventing them.",
  buildUserPrompt: ({ background, jobDescription, tone }) =>
    `Requested tone: ${tone}\n\nCandidate background:\n${background}\n\nTarget job description:\n${jobDescription || "Not provided."}`,
});
