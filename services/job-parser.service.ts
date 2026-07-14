import "@/lib/ai/prompts";

import { getPrompt } from "@/lib/ai/prompt-manager";
import { computeConfidence, type FieldPresence } from "@/lib/parsing/confidence";
import {
  DocumentExtractionError,
  extractTextFromDocument,
  type ExtractableFile,
} from "@/lib/parsing/document-extraction";
import { dedupeStrings, filterEmpty } from "@/lib/parsing/normalize";
import { generateAIJSON } from "@/services/ai.service";
import {
  isSupportedParserJobMimeType,
  PARSER_MAX_FILE_SIZE_BYTES,
} from "@/types/parser";
import {
  parsedJobDescriptionAIOutputSchema,
  type ParsedJobDescription,
  type ParsedJobDescriptionAIOutput,
  type ParsedJobKeyword,
} from "@/types/job-parser.schema";

export class JobParserServiceError extends Error {
  constructor(
    message: string,
    public status: number = 422,
  ) {
    super(message);
    this.name = "JobParserServiceError";
  }
}

const MAX_JOB_TEXT_LENGTH = 12000;
const MIN_JOB_TEXT_LENGTH = 20;

export type JobParserSource =
  | { kind: "text"; content: string }
  | { kind: "file"; file: ExtractableFile };

function dedupeKeywords(keywords: ParsedJobKeyword[]): ParsedJobKeyword[] {
  const byKeyword = new Map<string, ParsedJobKeyword>();

  for (const entry of keywords) {
    const keyword = entry.keyword.trim();
    if (!keyword) continue;
    const key = keyword.toLowerCase();
    const existing = byKeyword.get(key);
    if (!existing) {
      byKeyword.set(key, { keyword, importance: entry.importance });
    } else if (entry.importance > existing.importance) {
      // Keep the first-seen casing but take the higher importance score.
      byKeyword.set(key, { keyword: existing.keyword, importance: entry.importance });
    }
  }

  return Array.from(byKeyword.values()).sort(
    (a, b) => b.importance - a.importance,
  );
}

// Validates and normalizes the raw AI output: keyword duplicates are
// merged (keeping the higher importance), skill/technology lists are
// deduplicated, and blank responsibilities are dropped.
function normalizeParsedJobDescription(
  raw: ParsedJobDescriptionAIOutput,
): ParsedJobDescriptionAIOutput {
  return {
    company: raw.company,
    position: raw.position,
    responsibilities: filterEmpty(raw.responsibilities),
    requiredSkills: {
      technical: dedupeStrings(raw.requiredSkills.technical),
      programmingLanguages: dedupeStrings(raw.requiredSkills.programmingLanguages),
      frameworks: dedupeStrings(raw.requiredSkills.frameworks),
      tools: dedupeStrings(raw.requiredSkills.tools),
      softSkills: dedupeStrings(raw.requiredSkills.softSkills),
    },
    preferredSkills: dedupeStrings(raw.preferredSkills),
    keywords: dedupeKeywords(raw.keywords),
    technologies: {
      languages: dedupeStrings(raw.technologies.languages),
      frameworks: dedupeStrings(raw.technologies.frameworks),
      databases: dedupeStrings(raw.technologies.databases),
      cloudPlatforms: dedupeStrings(raw.technologies.cloudPlatforms),
      devopsTools: dedupeStrings(raw.technologies.devopsTools),
      other: dedupeStrings(raw.technologies.other),
    },
    salary: raw.salary,
    workMode: raw.workMode,
    applicationDeadline: raw.applicationDeadline,
  };
}

function buildConfidenceInput(
  parsed: ParsedJobDescriptionAIOutput,
): Record<string, FieldPresence[]> {
  const present = (value: string) => value.trim().length > 0;

  return {
    company: [
      { path: "company.name", present: present(parsed.company.name) },
      { path: "company.industry", present: present(parsed.company.industry) },
      { path: "company.location", present: present(parsed.company.location) },
    ],
    position: [
      { path: "position.title", present: present(parsed.position.title) },
      {
        path: "position.employmentType",
        present: present(parsed.position.employmentType),
      },
      {
        path: "position.experienceRequired",
        present: present(parsed.position.experienceRequired),
      },
    ],
    responsibilities: [
      { path: "responsibilities", present: parsed.responsibilities.length > 0 },
    ],
    requiredSkills: [
      {
        path: "requiredSkills.technical",
        present: parsed.requiredSkills.technical.length > 0,
      },
      {
        path: "requiredSkills.programmingLanguages",
        present: parsed.requiredSkills.programmingLanguages.length > 0,
      },
    ],
    keywords: [{ path: "keywords", present: parsed.keywords.length > 0 }],
    technologies: [
      {
        path: "technologies.languages",
        present: parsed.technologies.languages.length > 0,
      },
      {
        path: "technologies.frameworks",
        present: parsed.technologies.frameworks.length > 0,
      },
    ],
  };
}

async function resolveJobText(source: JobParserSource): Promise<string> {
  if (source.kind === "text") {
    const content = source.content.trim();
    if (content.length < MIN_JOB_TEXT_LENGTH) {
      throw new JobParserServiceError(
        "The job description is too short to parse. Please provide more detail.",
      );
    }
    return content;
  }

  const { file } = source;
  if (!isSupportedParserJobMimeType(file.mimeType)) {
    throw new JobParserServiceError(
      "Unsupported file type. Please upload a PDF, DOCX, or plain text file.",
    );
  }
  if (file.buffer.byteLength === 0) {
    throw new JobParserServiceError("The uploaded file is empty.");
  }
  if (file.buffer.byteLength > PARSER_MAX_FILE_SIZE_BYTES) {
    throw new JobParserServiceError(
      "The uploaded file is too large. Maximum size is 5MB.",
    );
  }

  try {
    const text = await extractTextFromDocument(file, { allowPlainText: true });
    if (text.length < MIN_JOB_TEXT_LENGTH) {
      throw new JobParserServiceError(
        "The job description is too short to parse. Please provide more detail.",
      );
    }
    return text;
  } catch (error) {
    if (error instanceof DocumentExtractionError) {
      throw new JobParserServiceError(error.message, error.status);
    }
    throw error;
  }
}

// Extracts structured, validated information from a job description,
// supplied either as plain text or an uploaded file. Reusable by every AI
// feature that needs to reason about a target role (Tailoring, ATS
// Analysis, Skill Gap Analysis, Cover Letters).
export async function parseJobDescription(
  source: JobParserSource,
  userId: string,
): Promise<ParsedJobDescription> {
  const jobText = await resolveJobText(source);

  const template = getPrompt("JOB_PARSING");

  const raw = await generateAIJSON({
    feature: "JOB_PARSING",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({
      jobText: jobText.slice(0, MAX_JOB_TEXT_LENGTH),
    }),
    schema: parsedJobDescriptionAIOutputSchema,
  });

  const normalized = normalizeParsedJobDescription(raw);
  const confidence = computeConfidence(buildConfidenceInput(normalized));

  return { ...normalized, confidence };
}
