import { COVER_LETTER_TONES, type CoverLetterTone } from "@/lib/enums";
import { COVER_LETTER_TONE_LABELS } from "@/types/cover-letter";

type Props = {
  id: string;
  value: CoverLetterTone;
  onChange: (tone: CoverLetterTone) => void;
  disabled?: boolean;
};

// Native select styled to match the Input component (no Select primitive
// exists in components/ui yet, and a 10-option dropdown doesn't warrant
// introducing one).
export function ToneSelect({ id, value, onChange, disabled }: Props) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as CoverLetterTone)}
      className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {COVER_LETTER_TONES.map((tone) => (
        <option key={tone} value={tone}>
          {COVER_LETTER_TONE_LABELS[tone]}
        </option>
      ))}
    </select>
  );
}
