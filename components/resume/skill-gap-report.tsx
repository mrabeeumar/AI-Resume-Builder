import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SkillGapReport } from "@/types/skill-gap";

type Props = {
  report: SkillGapReport;
};

const SCORE_ROWS: { key: keyof SkillGapReport["scores"]; label: string }[] = [
  { key: "overallScore", label: "Overall match" },
  { key: "skillsMatchScore", label: "Skills match" },
  { key: "experienceMatchScore", label: "Experience match" },
  { key: "educationMatchScore", label: "Education match" },
  { key: "atsKeywordMatchScore", label: "ATS keyword match" },
];

const PRIORITY_VARIANT: Record<string, "destructive" | "warning" | "secondary"> = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};

function scoreColor(score: number) {
  if (score >= 80) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-destructive";
}

function TagList({ title, items, variant }: {
  title: string;
  items: string[];
  variant?: "default" | "warning" | "success" | "destructive" | "secondary";
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground text-xs font-medium">{title}</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item}>
            <Badge variant={variant}>{item}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-foreground text-xs font-medium">{title}</p>
      <ul className="text-muted-foreground list-disc pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function SkillGapReportView({ report }: Props) {
  const { missingSkills } = report;

  return (
    <div className="flex flex-col gap-6">
      <Card className="gap-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground font-semibold">Match scores</h2>
          <Badge variant={report.confidence >= 60 ? "success" : "warning"}>
            {report.confidence}% confidence
          </Badge>
        </div>
        <div className="flex flex-col gap-3">
          {SCORE_ROWS.map((row) => {
            const score = report.scores[row.key];
            return (
              <div key={row.key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{row.label}</span>
                  <span className="text-muted-foreground">{score}/100</span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full ${scoreColor(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {report.summary && (
        <Card className="gap-2 p-4">
          <h2 className="text-foreground font-semibold">Summary</h2>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">
            {report.summary}
          </p>
        </Card>
      )}

      <Card className="gap-3 p-4">
        <h2 className="text-foreground font-semibold">Missing skills</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <TagList title="Technical" items={missingSkills.technical} variant="destructive" />
          <TagList title="Soft skills" items={missingSkills.softSkills} variant="warning" />
          <TagList title="Tools" items={missingSkills.tools} variant="destructive" />
          <TagList title="Frameworks" items={missingSkills.frameworks} variant="destructive" />
          <TagList title="Languages" items={missingSkills.languages} variant="destructive" />
          <TagList title="Databases" items={missingSkills.databases} variant="destructive" />
          <TagList
            title="Cloud technologies"
            items={missingSkills.cloudTechnologies}
            variant="destructive"
          />
        </div>
        {report.skillMatch.matchingSkills.length > 0 && (
          <TagList
            title="Matching skills"
            items={report.skillMatch.matchingSkills}
            variant="success"
          />
        )}
      </Card>

      <Card className="gap-3 p-4">
        <h2 className="text-foreground font-semibold">Strengths</h2>
        <TextList title="Existing strengths" items={report.strengths.existingStrengths} />
        <TextList
          title="Competitive advantages"
          items={report.strengths.competitiveAdvantages}
        />
        <TextList
          title="Relevant experience highlights"
          items={report.strengths.relevantExperienceHighlights}
        />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="gap-3 p-4">
          <h2 className="text-foreground font-semibold">Experience analysis</h2>
          {report.experience.experienceLevelMatch && (
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium">Level match: </span>
              {report.experience.experienceLevelMatch}
            </p>
          )}
          {report.experience.domainMatch && (
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium">Domain match: </span>
              {report.experience.domainMatch}
            </p>
          )}
          {report.experience.projectRelevance && (
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium">Project relevance: </span>
              {report.experience.projectRelevance}
            </p>
          )}
          <TextList
            title="Relevant experience"
            items={report.experience.relevantExperience}
          />
          <TextList title="Missing experience" items={report.experience.missingExperience} />
        </Card>

        <Card className="gap-3 p-4">
          <h2 className="text-foreground font-semibold">Education analysis</h2>
          <p className="text-sm">
            <Badge variant={report.education.degreeRequirementsMet ? "success" : "destructive"}>
              {report.education.degreeRequirementsMet
                ? "Degree requirements met"
                : "Degree requirements not met"}
            </Badge>
          </p>
          {report.education.notes && (
            <p className="text-muted-foreground text-sm">{report.education.notes}</p>
          )}
          <TextList
            title="Missing certifications"
            items={report.education.missingCertifications}
          />
          <TextList
            title="Additional qualifications needed"
            items={report.education.additionalQualificationsNeeded}
          />
        </Card>
      </div>

      <Card className="gap-4 p-4">
        <h2 className="text-foreground font-semibold">Learning roadmap</h2>
        <TextList title="Skills to learn first" items={report.roadmap.skillsToLearnFirst} />
        <TextList
          title="Suggested technologies"
          items={report.roadmap.suggestedTechnologies}
        />
        <TextList
          title="Recommended certifications"
          items={report.roadmap.recommendedCertifications}
        />
        <TextList
          title="Resume improvement suggestions"
          items={report.roadmap.resumeImprovementSuggestions}
        />
        {report.roadmap.portfolioProjectIdeas.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-foreground text-xs font-medium">
              Portfolio project ideas
            </p>
            <ul className="flex flex-col gap-2">
              {report.roadmap.portfolioProjectIdeas.map((idea) => (
                <li key={idea.title} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={PRIORITY_VARIANT[idea.priority]}>
                      {idea.priority}
                    </Badge>
                    <span className="text-foreground text-sm font-medium">
                      {idea.title}
                    </span>
                  </div>
                  {idea.description && (
                    <p className="text-muted-foreground pl-1 text-sm">
                      {idea.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
