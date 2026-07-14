import "@/lib/ai/prompts";

import { getPrompt } from "@/lib/ai/prompt-manager";
import { computeConfidence, type FieldPresence } from "@/lib/parsing/confidence";
import {
  DocumentExtractionError,
  extractTextFromDocument,
  type ExtractableFile,
} from "@/lib/parsing/document-extraction";
import {
  dedupeStrings,
  filterEmpty,
  isValidEmail,
  sanitizeUrl,
} from "@/lib/parsing/normalize";
import { generateAIJSON } from "@/services/ai.service";
import {
  isSupportedParserResumeMimeType,
  PARSER_MAX_FILE_SIZE_BYTES,
} from "@/types/parser";
import {
  parsedResumeAIOutputSchema,
  type ParsedEducation,
  type ParsedExperience,
  type ParsedResume,
  type ParsedResumeAIOutput,
  type ParsedSkill,
} from "@/types/resume-parser.schema";

export class ResumeParserServiceError extends Error {
  constructor(
    message: string,
    public status: number = 422,
  ) {
    super(message);
    this.name = "ResumeParserServiceError";
  }
}

const MAX_RESUME_TEXT_LENGTH = 20000;

function normalizeExperience(items: ParsedExperience[]): ParsedExperience[] {
  return items.map((item) => ({
    ...item,
    responsibilities: filterEmpty(item.responsibilities),
    achievements: filterEmpty(item.achievements),
    technologiesUsed: dedupeStrings(item.technologiesUsed),
  }));
}

function normalizeEducation(items: ParsedEducation[]): ParsedEducation[] {
  return items.filter(
    (item) => item.institution.trim() || item.degree.trim() || item.field.trim(),
  );
}

function normalizeSkills(skills: ParsedSkill): ParsedSkill {
  return {
    programmingLanguages: dedupeStrings(skills.programmingLanguages),
    frameworks: dedupeStrings(skills.frameworks),
    libraries: dedupeStrings(skills.libraries),
    databases: dedupeStrings(skills.databases),
    cloud: dedupeStrings(skills.cloud),
    tools: dedupeStrings(skills.tools),
    softSkills: dedupeStrings(skills.softSkills),
    other: dedupeStrings(skills.other),
  };
}

// Validates and normalizes the raw AI output: invalid emails/URLs are
// dropped rather than surfaced, skill lists are deduplicated (case
// insensitively) across each category, and empty education entries are
// removed. This is the "Validation" step of the parsing pipeline — it never
// invents data, only cleans up what the model returned.
function normalizeParsedResume(raw: ParsedResumeAIOutput): ParsedResumeAIOutput {
  return {
    personalInfo: {
      ...raw.personalInfo,
      email: isValidEmail(raw.personalInfo.email) ? raw.personalInfo.email : "",
      linkedin: sanitizeUrl(raw.personalInfo.linkedin),
      portfolio: sanitizeUrl(raw.personalInfo.portfolio),
      github: sanitizeUrl(raw.personalInfo.github),
    },
    summary: raw.summary,
    experience: normalizeExperience(raw.experience),
    projects: raw.projects.map((project) => ({
      ...project,
      technologies: dedupeStrings(project.technologies),
      outcomes: filterEmpty(project.outcomes),
      links: filterEmpty(project.links).filter((link) => sanitizeUrl(link) !== ""),
    })),
    education: normalizeEducation(raw.education),
    skills: normalizeSkills(raw.skills),
    certifications: raw.certifications.map((cert) => ({
      ...cert,
      credentialUrl: sanitizeUrl(cert.credentialUrl),
    })),
    languages: raw.languages.filter((lang) => lang.language.trim()),
  };
}

function buildConfidenceInput(
  parsed: ParsedResumeAIOutput,
): Record<string, FieldPresence[]> {
  const present = (value: string) => value.trim().length > 0;

  return {
    personalInfo: [
      { path: "personalInfo.name", present: present(parsed.personalInfo.name) },
      { path: "personalInfo.email", present: present(parsed.personalInfo.email) },
      { path: "personalInfo.phone", present: present(parsed.personalInfo.phone) },
      {
        path: "personalInfo.location",
        present: present(parsed.personalInfo.location),
      },
      {
        path: "personalInfo.linkedin",
        present: present(parsed.personalInfo.linkedin),
      },
      {
        path: "personalInfo.portfolio",
        present: present(parsed.personalInfo.portfolio),
      },
      {
        path: "personalInfo.github",
        present: present(parsed.personalInfo.github),
      },
    ],
    summary: [
      { path: "summary.summary", present: present(parsed.summary.summary) },
    ],
    experience: [
      { path: "experience", present: parsed.experience.length > 0 },
    ],
    education: [{ path: "education", present: parsed.education.length > 0 }],
    skills: [
      {
        path: "skills.programmingLanguages",
        present: parsed.skills.programmingLanguages.length > 0,
      },
      { path: "skills.frameworks", present: parsed.skills.frameworks.length > 0 },
      { path: "skills.tools", present: parsed.skills.tools.length > 0 },
    ],
    projects: [{ path: "projects", present: parsed.projects.length > 0 }],
    certifications: [
      { path: "certifications", present: parsed.certifications.length > 0 },
    ],
    languages: [{ path: "languages", present: parsed.languages.length > 0 }],
  };
}

function validateFile(file: ExtractableFile): void {
  if (!isSupportedParserResumeMimeType(file.mimeType)) {
    throw new ResumeParserServiceError(
      "Unsupported file type. Please upload a PDF or DOCX file.",
    );
  }
  if (file.buffer.byteLength === 0) {
    throw new ResumeParserServiceError("The uploaded file is empty.");
  }
  if (file.buffer.byteLength > PARSER_MAX_FILE_SIZE_BYTES) {
    throw new ResumeParserServiceError(
      "The uploaded file is too large. Maximum size is 5MB.",
    );
  }
}

// Extracts structured, validated information from an uploaded resume file.
// This is the reusable foundation for every AI feature that needs to reason
// about a candidate's resume (Tailoring, Review, Skill Gap Analysis, Cover
// Letters, ATS Analysis) — it does not persist anything or mutate the
// resume itself.
export async function parseResume(
  file: ExtractableFile,
  userId: string,
): Promise<ParsedResume> {
  validateFile(file);

  let resumeText: string;
  try {
    resumeText = await extractTextFromDocument(file);
  } catch (error) {
    if (error instanceof DocumentExtractionError) {
      throw new ResumeParserServiceError(error.message, error.status);
    }
    throw error;
  }

  const template = getPrompt("RESUME_PARSING");

  const raw = await generateAIJSON({
    feature: "RESUME_PARSING",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({
      resumeText: resumeText.slice(0, MAX_RESUME_TEXT_LENGTH),
    }),
    schema: parsedResumeAIOutputSchema,
  });

  const normalized = normalizeParsedResume(raw);
  const confidence = computeConfidence(buildConfidenceInput(normalized));

  return { ...normalized, confidence };
}
