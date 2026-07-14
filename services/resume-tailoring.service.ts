import "@/lib/ai/prompts";

import { getPrompt } from "@/lib/ai/prompt-manager";
import type {
  PageSize,
  ResumePageColor,
  ResumeSectionType,
  ResumeTemplateId,
  ResumeThemeColor,
} from "@/lib/enums";
import type { ExtractableFile } from "@/lib/parsing/document-extraction";
import { prisma } from "@/lib/prisma";
import { generateAIJSON } from "@/services/ai.service";
import { getOwnedJobDescriptionOrThrow } from "@/services/job-description.service";
import {
  parseJobDescription,
  type JobParserSource,
} from "@/services/job-parser.service";
import { getOwnedResumeOrThrow } from "@/services/resume.service";
import {
  compareVersions,
  getVersionForResume,
} from "@/services/resume-version.service";
import {
  computeExperienceMatchScore,
  matchSkills,
} from "@/services/skill-matching.service";
import type { ParsedJobDescription } from "@/types/job-parser.schema";
import {
  parseSectionContent,
  type CertificationsContent,
  type ExperienceContent,
  type ProjectsContent,
  type SkillsContent,
  type SummaryContent,
} from "@/types/resume-section";
import {
  saveTailoredResumeSchema,
  tailorResumeSchema,
  type MatchScore,
  type SaveTailoredResumeInput,
  type TailorResumeInput,
  type TailoringMetadata,
  type TailoringResponse,
  type TailoringSummary,
  type TailoredResumeSnapshot,
} from "@/types/resume-tailoring";
import {
  tailoredResumeAIOutputSchema,
  type TailoredResumeAIOutput,
} from "@/types/resume-tailoring.schema";
import type { ResumeSnapshotSection } from "@/types/resume-version";

export class ResumeTailoringServiceError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "ResumeTailoringServiceError";
  }
}

// Re-exported so callers/actions can import version comparison from the
// tailoring module without duplicating the (already-complete, M06) logic.
export { compareVersions as compareResumeVersions };

async function loadSourceSnapshot(
  resumeId: string,
  userId: string,
  sourceVersionId?: string,
): Promise<{ title: string; status: string; sections: ResumeSnapshotSection[] }> {
  if (sourceVersionId) {
    const version = await getVersionForResume(resumeId, sourceVersionId, userId);
    return {
      title: version.content.title,
      status: version.content.status,
      sections: version.content.sections,
    };
  }

  const resume = await getOwnedResumeOrThrow(resumeId, userId);
  const sections = await prisma.resumeSection.findMany({
    where: { resumeId },
    orderBy: { order: "asc" },
  });

  return {
    title: resume.title,
    status: resume.status,
    sections: sections.map((section) => ({
      type: section.type as ResumeSectionType,
      order: section.order,
      hidden: section.hidden,
      content: JSON.parse(section.content),
    })),
  };
}

function sectionContent<T>(
  sections: ResumeSnapshotSection[],
  type: ResumeSectionType,
): T {
  const section = sections.find((s) => s.type === type);
  return parseSectionContent(type, section?.content ?? {}) as T;
}

function buildResumeContext(sections: ResumeSnapshotSection[]): string {
  const parts: string[] = [];

  const summary = sectionContent<SummaryContent>(sections, "SUMMARY");
  if (summary.text) parts.push(`Summary: ${summary.text}`);

  const experience = sectionContent<ExperienceContent>(sections, "EXPERIENCE");
  for (const item of experience.items) {
    parts.push(
      `Experience [id=${item.id}] (${item.role} at ${item.company}, ` +
        `${item.startDate}–${item.current ? "Present" : item.endDate}): ` +
        `${item.description}`,
    );
  }

  const skills = sectionContent<SkillsContent>(sections, "SKILLS");
  if (skills.items.length > 0) {
    parts.push(`Skills: ${skills.items.join(", ")}`);
  }

  const projects = sectionContent<ProjectsContent>(sections, "PROJECTS");
  for (const item of projects.items) {
    parts.push(
      `Project [id=${item.id}] (${item.name}, tech: ${item.technologies}): ${item.description}`,
    );
  }

  const certifications = sectionContent<CertificationsContent>(
    sections,
    "CERTIFICATIONS",
  );
  for (const item of certifications.items) {
    parts.push(`Certification [id=${item.id}]: ${item.name} — ${item.issuer}`);
  }

  return parts.join("\n") || "The resume has no content yet.";
}

function buildJobContext(job: ParsedJobDescription): string {
  const parts: string[] = [];

  if (job.position.title) parts.push(`Title: ${job.position.title}`);
  if (job.company.name) parts.push(`Company: ${job.company.name}`);
  if (job.responsibilities.length > 0) {
    parts.push(`Responsibilities: ${job.responsibilities.join("; ")}`);
  }

  const requiredSkills = [
    ...job.requiredSkills.technical,
    ...job.requiredSkills.programmingLanguages,
    ...job.requiredSkills.frameworks,
    ...job.requiredSkills.tools,
  ];
  if (requiredSkills.length > 0) {
    parts.push(`Required skills: ${requiredSkills.join(", ")}`);
  }
  if (job.preferredSkills.length > 0) {
    parts.push(`Preferred skills: ${job.preferredSkills.join(", ")}`);
  }
  if (job.keywords.length > 0) {
    parts.push(`Keywords: ${job.keywords.map((k) => k.keyword).join(", ")}`);
  }

  return parts.join("\n") || "No additional job details available.";
}

function uniqueMerge(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const list of lists) {
    for (const value of list) {
      const key = value.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(value.trim());
    }
  }
  return result;
}

// Enforces the hallucination-prevention rule from .claude/docs/ai.md: the
// AI may only rewrite/reorder content that already exists on the resume. Any
// id, skill, or certification the model invents is dropped and surfaced as
// a warning rather than silently trusted.
function sanitizeAIOutput(
  raw: TailoredResumeAIOutput,
  sections: ResumeSnapshotSection[],
  warnings: string[],
): TailoredResumeAIOutput {
  const experience = sectionContent<ExperienceContent>(sections, "EXPERIENCE");
  const projects = sectionContent<ProjectsContent>(sections, "PROJECTS");
  const skills = sectionContent<SkillsContent>(sections, "SKILLS");
  const certifications = sectionContent<CertificationsContent>(
    sections,
    "CERTIFICATIONS",
  );

  const experienceIds = new Set(experience.items.map((item) => item.id));
  const projectIds = new Set(projects.items.map((item) => item.id));
  const certificationIds = new Set(certifications.items.map((item) => item.id));
  const normalizedSkills = new Map(
    skills.items.map((skill) => [skill.trim().toLowerCase(), skill]),
  );

  const sanitizedExperience = raw.experience.filter((item) => {
    const ok = experienceIds.has(item.id);
    if (!ok) {
      warnings.push(
        "Ignored an AI-suggested experience edit that did not match the original resume.",
      );
    }
    return ok;
  });

  const sanitizedProjects = raw.projects.filter((item) => {
    const ok = projectIds.has(item.id);
    if (!ok) {
      warnings.push(
        "Ignored an AI-suggested project edit that did not match the original resume.",
      );
    }
    return ok;
  });

  const sanitizedSkills = raw.skills
    .map((skill) => normalizedSkills.get(skill.trim().toLowerCase()))
    .filter((skill): skill is string => {
      if (!skill) {
        warnings.push(
          "Ignored an AI-suggested skill that is not on the original resume.",
        );
      }
      return Boolean(skill);
    });

  const sanitizedCertificationIds = raw.highlightedCertificationIds.filter(
    (id) => {
      const ok = certificationIds.has(id);
      if (!ok) {
        warnings.push(
          "Ignored an AI-suggested certification that did not match the original resume.",
        );
      }
      return ok;
    },
  );

  return {
    ...raw,
    experience: sanitizedExperience,
    projects: sanitizedProjects,
    // Fall back to the original (untailored) order if every suggestion was
    // rejected, rather than leaving the skills section empty.
    skills: sanitizedSkills.length > 0 ? sanitizedSkills : skills.items,
    highlightedCertificationIds: sanitizedCertificationIds,
  };
}

function computeTailoringConfidence(
  jobAnalysis: ParsedJobDescription,
  warnings: string[],
): number {
  const penalty = Math.min(40, warnings.length * 10);
  return Math.max(0, Math.round(jobAnalysis.confidence.overall - penalty));
}

// Generates a tailoring preview: parses the job description, computes a
// deterministic skill match, asks the AI to rewrite/reorder existing
// content, validates the response against hallucination rules, and scores
// the result. Nothing is persisted here — the resume and its sections are
// left untouched, satisfying the "original resume remains unchanged"
// requirement. Call `saveTailoredResume` to persist the result as a new
// ResumeVersion.
export async function generateTailoredResume(
  resumeId: string,
  userId: string,
  input: TailorResumeInput,
  fileSource?: ExtractableFile,
): Promise<TailoringResponse> {
  await getOwnedResumeOrThrow(resumeId, userId);
  const { jobDescriptionId, jobDescription, sourceVersionId } =
    tailorResumeSchema.parse(input);

  let jobTitle = "";
  let jobSource: JobParserSource;

  if (jobDescriptionId) {
    const saved = await getOwnedJobDescriptionOrThrow(jobDescriptionId, userId);
    jobTitle = saved.title;
    jobSource = { kind: "text", content: saved.content };
  } else if (fileSource) {
    jobSource = { kind: "file", file: fileSource };
  } else if (jobDescription) {
    jobSource = { kind: "text", content: jobDescription };
  } else {
    throw new ResumeTailoringServiceError(
      "A job description (text, file, or saved job description id) is required.",
      422,
    );
  }

  const jobAnalysis = await parseJobDescription(jobSource, userId);
  if (!jobTitle) jobTitle = jobAnalysis.position.title;

  const snapshot = await loadSourceSnapshot(resumeId, userId, sourceVersionId);
  const skills = sectionContent<SkillsContent>(snapshot.sections, "SKILLS");
  const experience = sectionContent<ExperienceContent>(
    snapshot.sections,
    "EXPERIENCE",
  );
  const resumeContext = buildResumeContext(snapshot.sections);
  const experienceText = experience.items
    .map((item) => item.description)
    .join("\n");

  const skillMatch = matchSkills(skills.items, resumeContext, jobAnalysis);
  const experienceMatchScore = computeExperienceMatchScore(
    experienceText,
    jobAnalysis,
  );

  const skillMatchContext =
    `Matching skills: ${skillMatch.matchingSkills.join(", ") || "none"}\n` +
    `Missing skills: ${skillMatch.missingSkills.join(", ") || "none"}`;

  const template = getPrompt("RESUME_TAILORING");
  const raw = await generateAIJSON({
    feature: "RESUME_TAILORING",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({
      resumeContext,
      jobContext: buildJobContext(jobAnalysis),
      skillMatchContext,
    }),
    schema: tailoredResumeAIOutputSchema,
  });

  const warnings: string[] = [];
  const tailored = sanitizeAIOutput(raw, snapshot.sections, warnings);

  const atsScore = Math.round(
    skillMatch.keywordCoverage * 0.5 + skillMatch.skillMatchScore * 0.5,
  );
  const matchScore: MatchScore = {
    overallScore: Math.round(
      (skillMatch.skillMatchScore +
        experienceMatchScore +
        atsScore +
        skillMatch.keywordCoverage) /
        4,
    ),
    skillMatchScore: skillMatch.skillMatchScore,
    experienceMatchScore,
    atsScore,
    keywordCoverageScore: skillMatch.keywordCoverage,
  };

  const summary: TailoringSummary = {
    overallImprovements: tailored.overallImprovements,
    sectionsModified: tailored.sectionsModified,
    keywordsIncorporated: tailored.keywordsIncorporated,
    missingSkillsIdentified: uniqueMerge(
      tailored.missingSkillsIdentified,
      skillMatch.missingSkills,
    ),
    recommendations: tailored.recommendations,
  };

  return {
    jobDescriptionId: jobDescriptionId ?? null,
    jobTitle,
    jobAnalysis,
    skillMatch,
    tailored,
    matchScore,
    summary,
    confidence: computeTailoringConfidence(jobAnalysis, warnings),
    warnings,
  };
}

function applyTailoredContent(
  sections: ResumeSnapshotSection[],
  tailored: TailoredResumeAIOutput,
): ResumeSnapshotSection[] {
  return sections.map((section) => {
    if (section.type === "SUMMARY" && tailored.summary) {
      const content: SummaryContent = { text: tailored.summary };
      return { ...section, content };
    }

    if (section.type === "EXPERIENCE") {
      const content = section.content as ExperienceContent;
      const overrides = new Map(
        tailored.experience.map((item) => [item.id, item.description]),
      );
      const updated: ExperienceContent = {
        items: content.items.map((item) =>
          overrides.has(item.id)
            ? { ...item, description: overrides.get(item.id)! }
            : item,
        ),
      };
      return { ...section, content: updated };
    }

    if (section.type === "SKILLS" && tailored.skills.length > 0) {
      const updated: SkillsContent = { items: tailored.skills };
      return { ...section, content: updated };
    }

    if (section.type === "PROJECTS") {
      const content = section.content as ProjectsContent;
      const overrides = new Map(
        tailored.projects.map((item) => [item.id, item.description]),
      );
      const updated: ProjectsContent = {
        items: content.items.map((item) =>
          overrides.has(item.id)
            ? { ...item, description: overrides.get(item.id)! }
            : item,
        ),
      };
      return { ...section, content: updated };
    }

    return section;
  });
}

// Persists a previously generated tailoring result as a new ResumeVersion.
// The live resume and its sections are never modified directly — the user
// can apply the tailored content later via the existing restore-version
// flow (services/resume-version.service.ts) if they choose to.
export async function saveTailoredResume(
  resumeId: string,
  userId: string,
  input: SaveTailoredResumeInput,
) {
  const resume = await getOwnedResumeOrThrow(resumeId, userId);
  const parsed = saveTailoredResumeSchema.parse(input);

  const sections = await prisma.resumeSection.findMany({
    where: { resumeId },
    orderBy: { order: "asc" },
  });
  const snapshotSections: ResumeSnapshotSection[] = sections.map((section) => ({
    type: section.type as ResumeSectionType,
    order: section.order,
    hidden: section.hidden,
    content: JSON.parse(section.content),
  }));

  const mergedSections = applyTailoredContent(snapshotSections, parsed.tailored);

  const tailoringMetadata: TailoringMetadata = {
    jobDescriptionId: parsed.jobDescriptionId ?? null,
    jobTitle: parsed.jobTitle,
    matchScore: parsed.matchScore,
    confidenceScore: parsed.confidence,
    summary: parsed.summary,
    tailoredAt: new Date().toISOString(),
  };

  const snapshot: TailoredResumeSnapshot = {
    title: resume.title,
    status: resume.status,
    templateId: resume.templateId as ResumeTemplateId,
    themeColor: resume.themeColor as ResumeThemeColor,
    pageColor: resume.pageColor as ResumePageColor,
    pageSize: resume.pageSize as PageSize,
    sections: mergedSections,
    tailoring: tailoringMetadata,
  };

  const last = await prisma.resumeVersion.findFirst({
    where: { resumeId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  });

  const version = await prisma.resumeVersion.create({
    data: {
      resumeId,
      versionNumber: (last?.versionNumber ?? 0) + 1,
      content: JSON.stringify(snapshot),
      note: parsed.note?.trim() || `AI-tailored for ${parsed.jobTitle || "target role"}`,
    },
  });

  return {
    id: version.id,
    resumeId: version.resumeId,
    versionNumber: version.versionNumber,
    note: version.note,
    createdAt: version.createdAt,
    content: snapshot,
  };
}
