import type { AIFeature } from "@/lib/enums";

export type PromptTemplate = {
  feature: AIFeature;
  system: string;
  buildUserPrompt: (variables: Record<string, string>) => string;
};

// Central registry of AI prompts. Feature services (resume generation, ATS
// analysis, cover letters, ...) register their templates here instead of
// inlining prompt strings in components or routes.
const registry = new Map<AIFeature, PromptTemplate>();

export function registerPrompt(template: PromptTemplate): void {
  registry.set(template.feature, template);
}

export function getPrompt(feature: AIFeature): PromptTemplate {
  const template = registry.get(feature);
  if (!template) {
    throw new Error(`No prompt template registered for feature "${feature}".`);
  }
  return template;
}

// Fills `{{variable}}` placeholders in a template string. Missing variables
// are left as-is so callers notice the gap rather than silently emitting
// blank text.
export function interpolate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(variables, key)
      ? variables[key]
      : match,
  );
}
