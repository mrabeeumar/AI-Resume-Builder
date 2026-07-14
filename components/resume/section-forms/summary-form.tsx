import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImproveBulletButton } from "@/components/resume/section-forms/improve-bullet-button";
import type { SummaryContent } from "@/types/resume-section";

type Props = {
  content: SummaryContent;
  onChange: (content: SummaryContent) => void;
};

export function SummaryForm({ content, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="summary-text">Professional summary</Label>
      <Textarea
        id="summary-text"
        rows={4}
        value={content.text}
        onChange={(e) => onChange({ text: e.target.value })}
      />
      <ImproveBulletButton
        text={content.text}
        context="professional summary"
        onApply={(improved) => onChange({ text: improved })}
      />
    </div>
  );
}
