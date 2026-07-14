import { CoverLetterItem } from "@/components/cover-letter/cover-letter-item";
import type { CoverLetterListItem } from "@/types/cover-letter";

export function CoverLetterList({
  coverLetters,
}: {
  coverLetters: CoverLetterListItem[];
}) {
  if (coverLetters.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        You don&apos;t have any cover letters yet. Create one to get started.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {coverLetters.map((coverLetter) => (
        <CoverLetterItem key={coverLetter.id} coverLetter={coverLetter} />
      ))}
    </ul>
  );
}
