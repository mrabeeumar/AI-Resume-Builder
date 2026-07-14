import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { Textarea } from "@/components/ui/textarea";
import type {
  EducationContent,
  educationItemSchema,
} from "@/types/resume-section";
import { ItemListEditor } from "@/components/resume/section-forms/item-list-editor";
import type { z } from "zod";

type EducationItem = z.infer<typeof educationItemSchema>;

type Props = {
  content: EducationContent;
  onChange: (content: EducationContent) => void;
};

export function EducationForm({ content, onChange }: Props) {
  return (
    <ItemListEditor<EducationItem>
      items={content.items}
      onChange={(items) => onChange({ items })}
      createItem={() => ({
        id: crypto.randomUUID(),
        school: "",
        degree: "",
        fieldOfStudy: "",
        startDate: "",
        endDate: "",
        description: "",
      })}
      itemLabel={(item) =>
        [item.degree, item.school].filter(Boolean).join(" - ")
      }
      addLabel="Add education"
      emptyLabel="No education added yet."
      renderFields={(item, update) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>School</Label>
            <Input
              value={item.school}
              onChange={(e) => update({ school: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Degree</Label>
            <Input
              value={item.degree}
              onChange={(e) => update({ degree: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Field of study</Label>
            <Input
              value={item.fieldOfStudy}
              onChange={(e) => update({ fieldOfStudy: e.target.value })}
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
                onChange={(endDate) => update({ endDate })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={item.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>
        </div>
      )}
    />
  );
}
