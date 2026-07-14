import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { Textarea } from "@/components/ui/textarea";
import type {
  ExperienceContent,
  experienceItemSchema,
} from "@/types/resume-section";
import { ItemListEditor } from "@/components/resume/section-forms/item-list-editor";
import { ImproveBulletButton } from "@/components/resume/section-forms/improve-bullet-button";
import type { z } from "zod";

type ExperienceItem = z.infer<typeof experienceItemSchema>;

type Props = {
  content: ExperienceContent;
  onChange: (content: ExperienceContent) => void;
};

export function ExperienceForm({ content, onChange }: Props) {
  return (
    <ItemListEditor<ExperienceItem>
      items={content.items}
      onChange={(items) => onChange({ items })}
      createItem={() => ({
        id: crypto.randomUUID(),
        company: "",
        role: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
      })}
      itemLabel={(item) =>
        [item.role, item.company].filter(Boolean).join(" at ")
      }
      addLabel="Add experience"
      emptyLabel="No experience added yet."
      renderFields={(item, update) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            <Input
              value={item.role}
              onChange={(e) => update({ role: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Company</Label>
            <Input
              value={item.company}
              onChange={(e) => update({ company: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Location</Label>
            <Input
              value={item.location}
              onChange={(e) => update({ location: e.target.value })}
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-2">
              <Label>Start date</Label>
              <MonthYearPicker
                value={item.startDate}
                onChange={(startDate) => update({ startDate })}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label>End date</Label>
              <MonthYearPicker
                value={item.endDate}
                disabled={item.current}
                onChange={(endDate) => update({ endDate })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox
              checked={item.current}
              onCheckedChange={(checked) =>
                update({
                  current: checked === true,
                  endDate: checked === true ? "" : item.endDate,
                })
              }
            />
            Currently working here
          </label>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={item.description}
              onChange={(e) => update({ description: e.target.value })}
            />
            <ImproveBulletButton
              text={item.description}
              context={[item.role, item.company].filter(Boolean).join(" at ")}
              onApply={(improved) => update({ description: improved })}
            />
          </div>
        </div>
      )}
    />
  );
}
