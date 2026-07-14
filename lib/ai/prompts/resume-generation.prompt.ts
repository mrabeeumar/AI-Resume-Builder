import { registerPrompt } from "@/lib/ai/prompt-manager";

registerPrompt({
  feature: "RESUME_GENERATION",
  system:
    "You are an expert resume writer. Given a candidate's background and " +
    "optionally a target job description, produce structured resume " +
    "content. Respond with strictly valid JSON only (no markdown fences, " +
    'no commentary) matching this shape: { "summary": string, ' +
    '"experience": [{ "company": string, "role": string, "location": ' +
    'string, "startDate": string, "endDate": string, "current": boolean, ' +
    '"description": string }], "education": [{ "school": string, ' +
    '"degree": string, "fieldOfStudy": string, "startDate": string, ' +
    '"endDate": string, "description": string }], "skills": string[], ' +
    '"projects": [{ "name": string, "description": string, "url": ' +
    'string, "technologies": string }] }. Use impact-focused, quantified ' +
    "bullet points where possible. Only include information that can be " +
    "reasonably inferred from the candidate's background; leave fields " +
    "empty rather than inventing facts.",
  buildUserPrompt: ({ background, jobDescription }) =>
    jobDescription
      ? `Candidate background:\n${background}\n\nTarget job description:\n${jobDescription}\n\nTailor the resume content toward this job.`
      : `Candidate background:\n${background}`,
});
