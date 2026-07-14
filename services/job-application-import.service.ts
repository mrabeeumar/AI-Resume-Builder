import { EMPLOYMENT_TYPES, WORK_MODES } from "@/lib/enums";
import {
  fetchHtml,
  HtmlExtractionError,
  sanitizeHtmlToText,
} from "@/lib/parsing/html-extraction";
import { prisma } from "@/lib/prisma";
import { parseJobDescription } from "@/services/job-parser.service";
import {
  importJobApplicationSchema,
  type ImportJobApplicationInput,
  type JobApplicationItem,
} from "@/types/job-application";
import type { ParsedJobDescription } from "@/types/job-parser.schema";

const MIN_EXTRACTED_TEXT_LENGTH = 40;

function matchEmploymentType(raw: string): (typeof EMPLOYMENT_TYPES)[number] | null {
  const normalized = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return (EMPLOYMENT_TYPES as readonly string[]).includes(normalized)
    ? (normalized as (typeof EMPLOYMENT_TYPES)[number])
    : null;
}

function matchWorkMode(raw: string): (typeof WORK_MODES)[number] | null {
  const normalized = raw.trim().toUpperCase();
  return (WORK_MODES as readonly string[]).includes(normalized)
    ? (normalized as (typeof WORK_MODES)[number])
    : null;
}

function parseDeadline(raw: string): Date | null {
  if (!raw.trim()) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Downloads a job posting URL, extracts structured job information via the
// existing JOB_PARSING AI pipeline, and creates a Job Workspace. Any field
// that cannot be extracted is stored as null — never invented (see roadmap
// M21 "Method 1 — Import Job From URL").
export async function importJobApplicationFromUrl(
  input: ImportJobApplicationInput,
  userId: string,
): Promise<JobApplicationItem> {
  const { url } = importJobApplicationSchema.parse(input);

  const html = await fetchHtml(url);
  const text = sanitizeHtmlToText(html);

  const parsed: ParsedJobDescription = await parseJobDescription(
    { kind: "text", content: text.slice(0, 20000) },
    userId,
  );

  if (text.trim().length < MIN_EXTRACTED_TEXT_LENGTH && !parsed.position.title) {
    throw new HtmlExtractionError(
      "No usable job information could be extracted from this page.",
    );
  }

  const application = await prisma.jobApplication.create({
    data: {
      userId,
      company: parsed.company.name || "Unknown Company",
      position: parsed.position.title || "Unknown Position",
      location: parsed.company.location || null,
      salary: parsed.salary || null,
      employmentType: matchEmploymentType(parsed.position.employmentType),
      workMode: matchWorkMode(parsed.workMode),
      source: "URL_IMPORT",
      originalJobUrl: url,
      parsedJobDescription: JSON.stringify(parsed),
      deadline: parseDeadline(parsed.applicationDeadline),
    },
  });

  await prisma.applicationTimeline.create({
    data: {
      applicationId: application.id,
      event: "STATUS_UPDATED",
      notes: "Application imported from job URL.",
    },
  });

  return {
    id: application.id,
    company: application.company,
    companyLogo: application.companyLogo,
    position: application.position,
    location: application.location,
    status: application.status as JobApplicationItem["status"],
    source: application.source as JobApplicationItem["source"],
    applicationDate: application.applicationDate,
    deadline: application.deadline,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    salary: application.salary,
    employmentType: application.employmentType as JobApplicationItem["employmentType"],
    workMode: application.workMode as JobApplicationItem["workMode"],
    originalJobUrl: application.originalJobUrl,
    parsedJobDescription: parsed,
    notes: application.notes,
    resumeId: application.resumeId,
    resumeVersionId: application.resumeVersionId,
    coverLetterId: application.coverLetterId,
    jobDescriptionId: application.jobDescriptionId,
  };
}
