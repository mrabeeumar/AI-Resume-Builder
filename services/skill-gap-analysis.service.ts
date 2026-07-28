import "@/lib/ai/prompts";

import { getPrompt } from "@/lib/ai/prompt-manager";
import type { ResumeSectionType } from "@/lib/enums";
import type { ExtractableFile } from "@/lib/parsing/document-extraction";
import { prisma } from "@/lib/prisma";
import { generateAIJSON } from "@/services/ai.service";
import { getOwnedJobDescriptionOrThrow } from "@/services/job-description.service";
import {
  parseJobDescription,
  type JobParserSource,
} from "@/services/job-parser.service";
import { getOwnedResumeOrThrow, ResumeServiceError } from "@/services/resume.service";
import { getVersionForResume } from "@/services/resume-version.service";
import {
  computeExperienceMatchScore,
  matchSkills,
} from "@/services/skill-matching.service";
import type { ParsedJobDescription } from "@/types/job-parser.schema";
import {
  parseSectionContent,
  type CertificationsContent,
  type CustomContent,
  type EducationContent,
  type ExperienceContent,
  type ProjectsContent,
  type SkillsContent,
  type SummaryContent,
} from "@/types/resume-section";
import type { ResumeSnapshotSection } from "@/types/resume-version";
import {
  generateSkillGapAnalysisSchema,
  type GenerateSkillGapAnalysisInput,
  type SkillGapAnalysisItem,
  type SkillGapAnalysisListItem,
  type SkillGapMatchScores,
  type SkillGapReport,
} from "@/types/skill-gap";
import { skillGapAnalysisAIOutputSchema } from "@/types/skill-gap.schema";

export class SkillGapAnalysisServiceError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "SkillGapAnalysisServiceError";
  }
}

async function loadAnalysisSections(
  resumeId: string,
  userId: string,
  versionId?: string,
): Promise<ResumeSnapshotSection[]> {
  if (versionId) {
    const version = await getVersionForResume(resumeId, versionId, userId);
    return version.content.sections;
  }

  const sections = await prisma.resumeSection.findMany({
    where: { resumeId },
    orderBy: { order: "asc" },
  });

  return sections.map((section) => ({
    type: section.type as ResumeSectionType,
    order: section.order,
    hidden: section.hidden,
    content: JSON.parse(section.content),
  }));
}

// Trimmed, human-readable resume context sent to the model — only the
// fields relevant to skill-gap analysis, per the token-economy rule in
// .claude/docs/ai.md. Mirrors buildResumeContext in resume-tailoring.service.ts.
function buildResumeContext(sections: ResumeSnapshotSection[]): string {
  const parts: string[] = [];

  const summary = parseSectionContent(
    "SUMMARY",
    sections.find((s) => s.type === "SUMMARY")?.content ?? {},
  ) as SummaryContent;
  if (summary.text) parts.push(`Summary: ${summary.text}`);

  const experience = parseSectionContent(
    "EXPERIENCE",
    sections.find((s) => s.type === "EXPERIENCE")?.content ?? {},
  ) as ExperienceContent;
  for (const item of experience.items) {
    parts.push(
      `Experience (${item.role} at ${item.company}, ` +
        `${item.startDate}–${item.current ? "Present" : item.endDate}): ` +
        `${item.description}`,
    );
  }

  const education = parseSectionContent(
    "EDUCATION",
    sections.find((s) => s.type === "EDUCATION")?.content ?? {},
  ) as EducationContent;
  for (const item of education.items) {
    parts.push(`Education: ${item.degree} in ${item.fieldOfStudy} at ${item.school}`);
  }

  const skills = parseSectionContent(
    "SKILLS",
    sections.find((s) => s.type === "SKILLS")?.content ?? {},
  ) as SkillsContent;
  if (skills.items.length > 0) {
    parts.push(`Skills: ${skills.items.join(", ")}`);
  }

  const projects = parseSectionContent(
    "PROJECTS",
    sections.find((s) => s.type === "PROJECTS")?.content ?? {},
  ) as ProjectsContent;
  for (const item of projects.items) {
    parts.push(`Project (${item.name}, tech: ${item.technologies}): ${item.description}`);
  }

  const certifications = parseSectionContent(
    "CERTIFICATIONS",
    sections.find((s) => s.type === "CERTIFICATIONS")?.content ?? {},
  ) as CertificationsContent;
  for (const item of certifications.items) {
    parts.push(`Certification: ${item.name} — ${item.issuer}`);
  }

  const customSections = sections.filter((s) => s.type === "CUSTOM");
  for (const section of customSections) {
    const custom = parseSectionContent("CUSTOM", section.content) as CustomContent;
    for (const item of custom.items) {
      parts.push(
        `${custom.heading || "Additional"}: ${item.title} — ${item.description}`,
      );
    }
  }

  return parts.join("\n") || "The resume has no content yet.";
}

function buildJobContext(job: ParsedJobDescription): string {
  const parts: string[] = [];

  if (job.position.title) parts.push(`Title: ${job.position.title}`);
  if (job.company.name) parts.push(`Company: ${job.company.name}`);
  if (job.position.experienceRequired) {
    parts.push(`Experience required: ${job.position.experienceRequired}`);
  }
  if (job.position.educationRequired) {
    parts.push(`Education required: ${job.position.educationRequired}`);
  }
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
  if (job.requiredSkills.softSkills.length > 0) {
    parts.push(`Required soft skills: ${job.requiredSkills.softSkills.join(", ")}`);
  }
  if (job.preferredSkills.length > 0) {
    parts.push(`Preferred skills: ${job.preferredSkills.join(", ")}`);
  }
  if (job.keywords.length > 0) {
    parts.push(`ATS keywords: ${job.keywords.map((k) => k.keyword).join(", ")}`);
  }

  return parts.join("\n") || "No additional job details available.";
}

function computeEducationMatchScore(
  degreeRequirementsMet: boolean,
  missingCertifications: string[],
): number {
  const penalty = (degreeRequirementsMet ? 0 : 40) + Math.min(40, missingCertifications.length * 8);
  return Math.max(0, 100 - penalty);
}

function computeOverallScore(scores: Omit<SkillGapMatchScores, "overallScore">): number {
  return Math.round(
    (scores.skillsMatchScore +
      scores.experienceMatchScore +
      scores.educationMatchScore +
      scores.atsKeywordMatchScore) /
      4,
  );
}

function computeConfidence(jobAnalysis: ParsedJobDescription): number {
  return jobAnalysis.confidence.overall;
}

function serializeAnalysis(analysis: {
  id: string;
  resumeId: string;
  versionId: string | null;
  jobDescriptionId: string | null;
  overallScore: number;
  content: string;
  createdAt: Date;
}): SkillGapAnalysisItem {
  return {
    id: analysis.id,
    resumeId: analysis.resumeId,
    versionId: analysis.versionId,
    jobDescriptionId: analysis.jobDescriptionId,
    overallScore: analysis.overallScore,
    createdAt: analysis.createdAt,
    content: JSON.parse(analysis.content) as SkillGapReport,
  };
}

// Compares a resume against a job description to identify missing skills,
// strengths, and match scores, and generates a prioritized learning
// roadmap. The original resume is never modified — analysis is read-only
// and persisted as history (see .claude/roadmap/M18-skill-gap-analysis.md).
export async function generateSkillGapAnalysis(
  resumeId: string,
  userId: string,
  input: GenerateSkillGapAnalysisInput,
  fileSource?: ExtractableFile,
): Promise<SkillGapAnalysisItem> {
  await getOwnedResumeOrThrow(resumeId, userId);
  const { jobDescriptionId, jobDescription, versionId } =
    generateSkillGapAnalysisSchema.parse(input);

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
    throw new SkillGapAnalysisServiceError(
      "A job description (text, file, or saved job description id) is required.",
      422,
    );
  }

  const jobAnalysis = await parseJobDescription(jobSource, userId);
  if (!jobTitle) jobTitle = jobAnalysis.position.title;

  const sections = await loadAnalysisSections(resumeId, userId, versionId);
  const skills = parseSectionContent(
    "SKILLS",
    sections.find((s) => s.type === "SKILLS")?.content ?? {},
  ) as SkillsContent;
  const experience = parseSectionContent(
    "EXPERIENCE",
    sections.find((s) => s.type === "EXPERIENCE")?.content ?? {},
  ) as ExperienceContent;
  const experienceText = experience.items.map((item) => item.description).join("\n");
  const resumeContext = buildResumeContext(sections);

  const skillMatch = matchSkills(skills.items, resumeContext, jobAnalysis);
  const experienceMatchScore = computeExperienceMatchScore(experienceText, jobAnalysis);

  const skillMatchContext =
    `Matching skills: ${skillMatch.matchingSkills.join(", ") || "none"}\n` +
    `Missing skills: ${skillMatch.missingSkills.join(", ") || "none"}\n` +
    `Skill match score: ${skillMatch.skillMatchScore}/100\n` +
    `Keyword coverage: ${skillMatch.keywordCoverage}/100`;

  const template = getPrompt("SKILL_GAP_ANALYSIS");
  const analysis = await generateAIJSON({
    feature: "SKILL_GAP_ANALYSIS",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({
      resumeContext,
      jobContext: buildJobContext(jobAnalysis),
      skillMatchContext,
    }),
    schema: skillGapAnalysisAIOutputSchema,
  });

  const educationMatchScore = computeEducationMatchScore(
    analysis.education.degreeRequirementsMet,
    analysis.education.missingCertifications,
  );

  const scores: SkillGapMatchScores = {
    overallScore: 0,
    skillsMatchScore: skillMatch.skillMatchScore,
    experienceMatchScore,
    educationMatchScore,
    atsKeywordMatchScore: skillMatch.keywordCoverage,
  };
  scores.overallScore = computeOverallScore(scores);

  const report: SkillGapReport = {
    ...analysis,
    jobTitle,
    jobDescriptionId: jobDescriptionId ?? null,
    scores,
    skillMatch,
    confidence: computeConfidence(jobAnalysis),
  };

  const created = await prisma.skillGapAnalysis.create({
    data: {
      resumeId,
      versionId: versionId ?? null,
      jobDescriptionId: jobDescriptionId ?? null,
      overallScore: scores.overallScore,
      content: JSON.stringify(report),
    },
  });

  return serializeAnalysis(created);
}

export async function listSkillGapAnalysesForResume(
  resumeId: string,
  userId: string,
): Promise<SkillGapAnalysisListItem[]> {
  await getOwnedResumeOrThrow(resumeId, userId);

  return prisma.skillGapAnalysis.findMany({
    where: { resumeId },
    select: {
      id: true,
      resumeId: true,
      versionId: true,
      jobDescriptionId: true,
      overallScore: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSkillGapAnalysisForResume(
  resumeId: string,
  analysisId: string,
  userId: string,
): Promise<SkillGapAnalysisItem> {
  await getOwnedResumeOrThrow(resumeId, userId);

  const analysis = await prisma.skillGapAnalysis.findUnique({
    where: { id: analysisId },
  });

  if (!analysis || analysis.resumeId !== resumeId) {
    throw new ResumeServiceError("Skill gap analysis not found.", 404);
  }

  return serializeAnalysis(analysis);
}

export async function deleteSkillGapAnalysisForResume(
  resumeId: string,
  analysisId: string,
  userId: string,
): Promise<void> {
  await getOwnedResumeOrThrow(resumeId, userId);

  const analysis = await prisma.skillGapAnalysis.findUnique({
    where: { id: analysisId },
  });

  if (!analysis || analysis.resumeId !== resumeId) {
    throw new ResumeServiceError("Skill gap analysis not found.", 404);
  }

  await prisma.skillGapAnalysis.delete({ where: { id: analysisId } });
}
