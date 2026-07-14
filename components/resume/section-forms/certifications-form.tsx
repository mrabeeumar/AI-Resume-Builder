import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CertificationsContent,
  certificationItemSchema,
} from "@/types/resume-section";
import { ItemListEditor } from "@/components/resume/section-forms/item-list-editor";
import type { z } from "zod";

type CertificationItem = z.infer<typeof certificationItemSchema>;

type Props = {
  content: CertificationsContent;
  onChange: (content: CertificationsContent) => void;
};

export function CertificationsForm({ content, onChange }: Props) {
  return (
    <ItemListEditor<CertificationItem>
      items={content.items}
      onChange={(items) => onChange({ items })}
      createItem={() => ({
        id: crypto.randomUUID(),
        name: "",
        issuer: "",
        date: "",
        url: "",
      })}
      itemLabel={(item) => [item.name, item.issuer].filter(Boolean).join(" - ")}
      addLabel="Add certification"
      emptyLabel="No certifications added yet."
      renderFields={(item, update) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Name</Label>
            <Input
              value={item.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Issuer</Label>
            <Input
              value={item.issuer}
              onChange={(e) => update({ issuer: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Date</Label>
            <DatePicker
              value={item.date}
              onChange={(date) => update({ date })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>URL</Label>
            <Input
              value={item.url}
              onChange={(e) => update({ url: e.target.value })}
            />
          </div>
        </div>
      )}
    />
  );
}
