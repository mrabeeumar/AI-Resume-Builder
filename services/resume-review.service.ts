import "@/lib/ai/prompts";

import { getPrompt } from "@/lib/ai/prompt-manager";
import type { ResumeSectionType } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { generateAIJSON } from "@/services/ai.service";
import { analyzeAts } from "@/services/ats.service";
import { getOwnedResumeOrThrow, ResumeServiceError } from "@/services/resume.service";
import { getVersionForResume } from "@/services/resume-version.service";
import {
  generateReviewSchema,
  type GenerateReviewInput,
  type ResumeReviewItem,
  type ResumeReviewListItem,
  type ReviewReport,
} from "@/types/resume-review";
import { resumeReviewAIOutputSchema } from "@/types/resume-review.schema";
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

const CORE_SECTION_TYPES: ResumeSectionType[] = [
  "SUMMARY",
  "EXPERIENCE",
  "EDUCATION",
  "SKILLS",
];

function isSectionEmpty(type: ResumeSectionType, content: unknown): boolean {
  switch (type) {
    case "SUMMARY":
      return !(content as SummaryContent).text?.trim();
    case "EXPERIENCE":
      return (content as ExperienceContent).items.length === 0;
    case "EDUCATION":
      return (content as EducationContent).items.length === 0;
    case "SKILLS":
      return (content as SkillsContent).items.length === 0;
    default:
      return true;
  }
}

// Sections are checked deterministically against actual content rather than
// left to the model — see the identical rule in ats.service.ts.
function getMissingSections(
  sections: ResumeSnapshotSection[],
): ResumeSectionType[] {
  const byType = new Map<ResumeSectionType, unknown>(
    sections.map((section) => [section.type, section.content]),
  );

  return CORE_SECTION_TYPES.filter((type) => {
    const content = byType.get(type);
    return content === undefined || isSectionEmpty(type, content);
  });
}

function buildReviewSummary(sections: ResumeSnapshotSection[]): string {
  const parts: string[] = [];

  for (const section of sections) {
    const content = parseSectionContent(section.type, section.content);

    if (section.type === "SUMMARY") {
      const summary = content as SummaryContent;
      if (summary.text) parts.push(`Summary: ${summary.text}`);
    } else if (section.type === "EXPERIENCE") {
      const experience = content as ExperienceContent;
      for (const item of experience.items) {
        parts.push(
          `Experience (${item.role} at ${item.company}, ` +
            `${item.startDate}–${item.current ? "Present" : item.endDate}): ` +
            `${item.description}`,
        );
      }
    } else if (section.type === "EDUCATION") {
      const education = content as EducationContent;
      for (const item of education.items) {
        parts.push(
          `Education: ${item.degree} in ${item.fieldOfStudy} at ${item.school}`,
        );
      }
    } else if (section.type === "SKILLS") {
      const skills = content as SkillsContent;
      if (skills.items.length > 0) {
        parts.push(`Skills: ${skills.items.join(", ")}`);
      }
    } else if (section.type === "PROJECTS") {
      const projects = content as ProjectsContent;
      for (const item of projects.items) {
        parts.push(
          `Project: ${item.name} (tech: ${item.technologies}): ${item.description}`,
        );
      }
    } else if (section.type === "CERTIFICATIONS") {
      const certifications = content as CertificationsContent;
      for (const item of certifications.items) {
        parts.push(`Certification: ${item.name} — ${item.issuer}`);
      }
    } else if (section.type === "CUSTOM") {
      const custom = content as CustomContent;
      for (const item of custom.items) {
        parts.push(
          `${custom.heading || "Additional"}: ${item.title} — ${item.description}`,
        );
      }
    }
  }

  return parts.join("\n") || "The resume has no content yet.";
}

async function loadReviewSections(
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

function computeOverallScore(scores: {
  content: number;
  readability: number;
  grammar: number;
  experience: number;
  ats: number;
}): number {
  return Math.round(
    (scores.content +
      scores.readability +
      scores.grammar +
      scores.experience +
      scores.ats) /
      5,
  );
}

function serializeReview(review: {
  id: string;
  resumeId: string;
  versionId: string | null;
  overallScore: number;
  content: string;
  createdAt: Date;
}): ResumeReviewItem {
  return {
    id: review.id,
    resumeId: review.resumeId,
    versionId: review.versionId,
    overallScore: review.overallScore,
    createdAt: review.createdAt,
    content: JSON.parse(review.content) as ReviewReport,
  };
}

// Generates a comprehensive, read-only review of a resume — content
// quality, experience, skills, projects, education, grammar, and ATS
// compatibility — with scores and prioritized improvement suggestions.
// Reuses the existing ATS analysis (services/ats.service.ts) rather than
// duplicating its keyword/ATS logic, and persists the result so it can be
// revisited later (see .claude/roadmap/M17-resume-review.md).
export async function generateResumeReview(
  resumeId: string,
  userId: string,
  input: GenerateReviewInput,
): Promise<ResumeReviewItem> {
  await getOwnedResumeOrThrow(resumeId, userId);
  const { versionId } = generateReviewSchema.parse(input);

  const sections = await loadReviewSections(resumeId, userId, versionId);
  const missingSections = getMissingSections(sections);

  const [ats, analysis] = await Promise.all([
    analyzeAts(resumeId, userId, { jobDescription: "" }),
    (async () => {
      const template = getPrompt("RESUME_REVIEW");
      return generateAIJSON({
        feature: "RESUME_REVIEW",
        userId,
        system: template.system,
        prompt: template.buildUserPrompt({
          resumeSummary: buildReviewSummary(sections),
          missingSections: missingSections.join(", ") || "None",
        }),
        schema: resumeReviewAIOutputSchema,
      });
    })(),
  ]);

  const overall = computeOverallScore({
    ...analysis.scores,
    ats: ats.overallScore,
  });

  const report: ReviewReport = {
    ...analysis,
    scores: { ...analysis.scores, ats: ats.overallScore, overall },
    missingSections,
    ats,
  };

  const created = await prisma.resumeReview.create({
    data: {
      resumeId,
      versionId: versionId ?? null,
      overallScore: overall,
      content: JSON.stringify(report),
    },
  });

  return serializeReview(created);
}

export async function listReviewsForResume(
  resumeId: string,
  userId: string,
): Promise<ResumeReviewListItem[]> {
  await getOwnedResumeOrThrow(resumeId, userId);

  return prisma.resumeReview.findMany({
    where: { resumeId },
    select: {
      id: true,
      resumeId: true,
      versionId: true,
      overallScore: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReviewForResume(
  resumeId: string,
  reviewId: string,
  userId: string,
): Promise<ResumeReviewItem> {
  await getOwnedResumeOrThrow(resumeId, userId);

  const review = await prisma.resumeReview.findUnique({
    where: { id: reviewId },
  });

  if (!review || review.resumeId !== resumeId) {
    throw new ResumeServiceError("Review not found.", 404);
  }

  return serializeReview(review);
}

export async function deleteReviewForResume(
  resumeId: string,
  reviewId: string,
  userId: string,
): Promise<void> {
  await getOwnedResumeOrThrow(resumeId, userId);

  const review = await prisma.resumeReview.findUnique({
    where: { id: reviewId },
  });

  if (!review || review.resumeId !== resumeId) {
    throw new ResumeServiceError("Review not found.", 404);
  }

  await prisma.resumeReview.delete({ where: { id: reviewId } });
}
