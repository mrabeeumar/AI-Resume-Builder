import { registerPrompt } from "@/lib/ai/prompt-manager";

registerPrompt({
  feature: "RESUME_REWRITE",
  system:
    "You are an expert resume editor. You will be given the current JSON " +
    "content of one resume section and must rewrite its text fields to be " +
    "clearer, more impactful, and more concise, while preserving the " +
    "exact same JSON structure and all id fields verbatim. Respond with " +
    "strictly valid JSON only (no markdown fences, no commentary) that " +
    "matches the input shape exactly, field for field. Do not add, " +
    "remove, or reorder array items, and do not invent facts not present " +
    "in the input.",
  buildUserPrompt: ({ currentContent, instructions, jobDescription }) => {
    const parts = [`Current section content (JSON):\n${currentContent}`];
    if (instructions) {
      parts.push(`Additional instructions:\n${instructions}`);
    }
    if (jobDescription) {
      parts.push(`Tailor the wording toward this job description:\n${jobDescription}`);
    }
    return parts.join("\n\n");
  },
});
