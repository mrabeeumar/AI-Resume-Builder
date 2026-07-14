import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SkillsContent } from "@/types/resume-section";

type Props = {
  content: SkillsContent;
  onChange: (content: SkillsContent) => void;
};

export function SkillsForm({ content, onChange }: Props) {
  const [draft, setDraft] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const skill = draft.trim();
    if (!skill || content.items.includes(skill)) {
      setDraft("");
      return;
    }
    onChange({ items: [...content.items, skill] });
    setDraft("");
  };

  const handleRemove = (skill: string) => {
    onChange({ items: content.items.filter((item) => item !== skill) });
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="skill-draft">Skill</Label>
          <Input
            id="skill-draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. TypeScript"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Add
        </Button>
      </form>
      {content.items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No skills added yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {content.items.map((skill) => (
            <li
              key={skill}
              className="bg-secondary text-secondary-foreground flex items-center gap-2 rounded-full px-3 py-1 text-sm"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemove(skill)}
                aria-label={`Remove ${skill}`}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
