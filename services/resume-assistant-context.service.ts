import type { ResumeSectionType } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { getOwnedResumeOrThrow } from "@/services/resume.service";
import { getVersionForResume } from "@/services/resume-version.service";
import type { ReviewReport } from "@/types/resume-review";
import {
  parseSectionContent,
  type CertificationsContent,
  type EducationContent,
  type ExperienceContent,
  type ProjectsContent,
  type SkillsContent,
  type SummaryContent,
} from "@/types/resume-section";
import type { TailoredResumeSnapshot } from "@/types/resume-tailoring";
import type { ResumeSnapshotSection } from "@/types/resume-version";
import type { SkillGapReport } from "@/types/skill-gap";

export type AssistantContext = {
  resumeContext: string;
  reviewContext: string;
  tailoringContext: string;
  skillGapContext: string;
};

// Trimmed, human-readable resume context sent to the model — only the
// fields relevant to a chat answer, per the token-economy rule in
// .claude/docs/ai.md. Mirrors buildResumeContext in resume-review.service.ts
// and skill-gap-analysis.service.ts.
function buildResumeContext(sections: ResumeSnapshotSection[]): string {
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
    }
  }

  return parts.join("\n") || "The resume has no content yet.";
}

function buildReviewContext(review: { overallScore: number; content: string } | null): string {
  if (!review) return "No resume review has been run yet.";

  const report = JSON.parse(review.content) as ReviewReport;
  const parts = [`Overall score: ${review.overallScore}/100`];

  for (const finding of report.sections) {
    parts.push(`${finding.section}: ${finding.status} — ${finding.notes}`);
  }
  if (report.missingSections.length > 0) {
    parts.push(`Missing sections: ${report.missingSections.join(", ")}`);
  }
  for (const rec of report.recommendations) {
    parts.push(`[${rec.priority}] ${rec.problem} — ${rec.suggestion}`);
  }

  return parts.join("\n");
}

function buildSkillGapContext(
  analysis: { overallScore: number; content: string } | null,
): string {
  if (!analysis) return "No skill gap analysis has been run yet.";

  const report = JSON.parse(analysis.content) as SkillGapReport;
  const parts = [
    `Target role: ${report.jobTitle || "Unspecified"}`,
    `Overall match score: ${analysis.overallScore}/100`,
    `Missing skills: ${report.skillMatch.missingSkills.join(", ") || "None"}`,
    `Skills to learn first: ${report.roadmap.skillsToLearnFirst.join(", ") || "None"}`,
    `Recommended certifications: ${report.roadmap.recommendedCertifications.join(", ") || "None"}`,
    `Summary: ${report.summary}`,
  ];

  return parts.join("\n");
}

async function buildTailoringContext(resumeId: string): Promise<string> {
  const version = await prisma.resumeVersion.findFirst({
    where: { resumeId },
    orderBy: { versionNumber: "desc" },
  });

  if (!version) return "No tailored resume version has been created yet.";

  const snapshot = JSON.parse(version.content) as TailoredResumeSnapshot;
  if (!snapshot.tailoring) {
    return "No tailored resume version has been created yet.";
  }

  const { tailoring } = snapshot;
  return (
    `Tailored for: ${tailoring.jobTitle || "Unspecified role"}\n` +
    `Match score: ${tailoring.matchScore.overallScore}/100\n` +
    `Sections modified: ${tailoring.summary.sectionsModified.join(", ") || "None"}\n` +
    `Keywords incorporated: ${tailoring.summary.keywordsIncorporated.join(", ") || "None"}\n` +
    `Improvements: ${tailoring.summary.overallImprovements.join("; ") || "None"}`
  );
}

async function loadSections(
  resumeId: string,
  userId: string,
  versionId?: string | null,
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

// Assembles the resume assistant's grounding context: resume content plus
// the most recent review, tailoring, and skill-gap results, so the
// assistant can answer questions without re-running any of those AI
// features itself. Reused by ResumeAssistantService for every chat turn.
export async function buildAssistantContext(
  resumeId: string,
  userId: string,
  versionId?: string | null,
): Promise<AssistantContext> {
  await getOwnedResumeOrThrow(resumeId, userId);

  const [sections, review, skillGap, tailoringContext] = await Promise.all([
    loadSections(resumeId, userId, versionId),
    prisma.resumeReview.findFirst({
      where: { resumeId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.skillGapAnalysis.findFirst({
      where: { resumeId },
      orderBy: { createdAt: "desc" },
    }),
    buildTailoringContext(resumeId),
  ]);

  return {
    resumeContext: buildResumeContext(sections),
    reviewContext: buildReviewContext(review),
    skillGapContext: buildSkillGapContext(skillGap),
    tailoringContext,
  };
}
