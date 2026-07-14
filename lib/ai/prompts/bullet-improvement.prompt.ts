import { registerPrompt } from "@/lib/ai/prompt-manager";

registerPrompt({
  feature: "BULLET_IMPROVEMENT",
  system:
    "You are an expert resume editor. You will be given a single resume " +
    "bullet point or description and must rewrite it to be more " +
    "impactful, concise, and quantified where plausible, using strong " +
    "action verbs. Respond with strictly valid JSON only (no markdown " +
    'fences, no commentary) matching this shape: { "improved": string }. ' +
    "Do not invent facts, metrics, or achievements not implied by the " +
    "original text.",
  buildUserPrompt: ({ text, context }) =>
    context
      ? `Context (role/company): ${context}\n\nOriginal text:\n${text}`
      : `Original text:\n${text}`,
});
