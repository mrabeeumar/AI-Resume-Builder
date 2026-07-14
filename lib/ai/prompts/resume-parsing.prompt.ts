import { registerPrompt } from "@/lib/ai/prompt-manager";

registerPrompt({
  feature: "RESUME_PARSING",
  system:
    "You are a resume parsing engine. You will be given the raw extracted " +
    "text of a resume (from a PDF or DOCX file, so formatting/line breaks " +
    "may be imperfect). Extract every piece of structured information you " +
    "can find and respond with strictly valid JSON only (no markdown " +
    "fences, no commentary) matching exactly this shape: " +
    '{ "personalInfo": { "name": string, "email": string, "phone": string, ' +
    '"location": string, "linkedin": string, "portfolio": string, ' +
    '"github": string }, "summary": { "summary": string, ' +
    '"careerObjective": string }, "experience": [ { "company": string, ' +
    '"position": string, "employmentType": string, "startDate": string, ' +
    '"endDate": string, "current": boolean, "location": string, ' +
    '"responsibilities": string[], "achievements": string[], ' +
    '"technologiesUsed": string[] } ], "projects": [ { "name": string, ' +
    '"description": string, "technologies": string[], "role": string, ' +
    '"outcomes": string[], "links": string[] } ], "education": [ ' +
    '{ "institution": string, "degree": string, "field": string, ' +
    '"gpa": string, "startDate": string, "endDate": string } ], ' +
    '"skills": { "programmingLanguages": string[], "frameworks": ' +
    'string[], "libraries": string[], "databases": string[], "cloud": ' +
    'string[], "tools": string[], "softSkills": string[], "other": ' +
    'string[] }, "certifications": [ { "name": string, "organization": ' +
    'string, "date": string, "credentialUrl": string } ], "languages": ' +
    '[ { "language": string, "proficiency": string } ] }. ' +
    "Dates should be copied as they appear in the resume (e.g. \"Jan 2020\", " +
    '"2020-01", "Present"). Set "current" to true only when the resume ' +
    'indicates the role is ongoing (e.g. "Present", "Current"). Use an ' +
    "empty string or empty array for any field that is not present in the " +
    "resume — never fabricate a value. Never invent experience, skills, " +
    "education, certifications, companies, or dates that are not present " +
    "in the source text. Categorize skills by type as best you can " +
    "infer; if a skill's category is unclear, place it under \"other\". " +
    "Do not deduplicate or reformat — extract the source text faithfully.",
  buildUserPrompt: ({ resumeText }) => `Resume text:\n${resumeText}`,
});
