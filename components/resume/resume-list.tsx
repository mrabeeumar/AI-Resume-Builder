import { ResumeItem } from "@/components/resume/resume-item";
import type { ResumeListItem } from "@/types/resume";

export function ResumeList({ resumes }: { resumes: ResumeListItem[] }) {
  if (resumes.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        You don&apos;t have any resumes yet. Create one to get started.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {resumes.map((resume) => (
        <ResumeItem key={resume.id} resume={resume} />
      ))}
    </ul>
  );
}
