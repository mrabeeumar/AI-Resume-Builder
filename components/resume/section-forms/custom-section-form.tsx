import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CustomContent, customItemSchema } from "@/types/resume-section";
import { ItemListEditor } from "@/components/resume/section-forms/item-list-editor";
import { ImproveBulletButton } from "@/components/resume/section-forms/improve-bullet-button";
import type { z } from "zod";

type CustomItem = z.infer<typeof customItemSchema>;

type Props = {
  content: CustomContent;
  onChange: (content: CustomContent) => void;
};

export function CustomSectionForm({ content, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Section heading</Label>
        <Input
          value={content.heading}
          placeholder="e.g. Publications, Volunteer Work"
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
        />
      </div>
      <ItemListEditor<CustomItem>
        items={content.items}
        onChange={(items) => onChange({ ...content, items })}
        createItem={() => ({
          id: crypto.randomUUID(),
          title: "",
          subtitle: "",
          date: "",
          description: "",
        })}
        itemLabel={(item) => item.title}
        addLabel="Add entry"
        emptyLabel="No entries added yet."
        renderFields={(item, update) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input
                value={item.title}
                onChange={(e) => update({ title: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Subtitle</Label>
              <Input
                value={item.subtitle}
                onChange={(e) => update({ subtitle: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Date</Label>
              <Input
                value={item.date}
                onChange={(e) => update({ date: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={item.description}
                onChange={(e) => update({ description: e.target.value })}
              />
              <ImproveBulletButton
                text={item.description}
                context={item.title}
                onApply={(improved) => update({ description: improved })}
              />
            </div>
          </div>
        )}
      />
    </div>
  );
}
