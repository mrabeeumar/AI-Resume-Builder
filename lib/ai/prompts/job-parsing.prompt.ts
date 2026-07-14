import { registerPrompt } from "@/lib/ai/prompt-manager";

registerPrompt({
  feature: "JOB_PARSING",
  system:
    "You are a job description parsing engine. You will be given the raw " +
    "text of a job posting. Extract every piece of structured information " +
    "you can find and respond with strictly valid JSON only (no markdown " +
    "fences, no commentary) matching exactly this shape: " +
    '{ "company": { "name": string, "industry": string, "location": ' +
    'string }, "position": { "title": string, "department": string, ' +
    '"employmentType": string, "experienceRequired": string, ' +
    '"educationRequired": string }, "responsibilities": string[], ' +
    '"requiredSkills": { "technical": string[], "programmingLanguages": ' +
    'string[], "frameworks": string[], "tools": string[], "softSkills": ' +
    'string[] }, "preferredSkills": string[], "keywords": [ { "keyword": ' +
    'string, "importance": number (1-10) } ], "technologies": ' +
    '{ "languages": string[], "frameworks": string[], "databases": ' +
    'string[], "cloudPlatforms": string[], "devopsTools": string[], ' +
    '"other": string[] }, "salary": string, "workMode": string, ' +
    '"applicationDeadline": string }. "workMode" should be one of ' +
    '"ONSITE", "REMOTE", or "HYBRID" when determinable from the posting. ' +
    '"applicationDeadline" should be an ISO 8601 date (YYYY-MM-DD) when a ' +
    "specific deadline is stated, otherwise an empty string. " +
    "Each responsibility should be a single, separate structured item — " +
    "split run-on bullet points rather than combining several duties into " +
    'one string. "keywords" should identify the terms an ATS system would ' +
    "match against (skills, tools, certifications, role titles), ranked by " +
    "importance where 10 is most important to the role and 1 is barely " +
    "relevant; do not include more than one entry per distinct keyword. " +
    '"preferredSkills" covers optional/"nice to have" qualifications only — ' +
    'do not duplicate entries already listed in "requiredSkills". Use an ' +
    "empty string or empty array for any field that is not present in the " +
    "posting — never fabricate a value.",
  buildUserPrompt: ({ jobText }) => `Job description text:\n${jobText}`,
});
