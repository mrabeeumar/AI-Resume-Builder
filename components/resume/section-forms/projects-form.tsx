import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  ProjectsContent,
  projectItemSchema,
} from "@/types/resume-section";
import { ItemListEditor } from "@/components/resume/section-forms/item-list-editor";
import { ImproveBulletButton } from "@/components/resume/section-forms/improve-bullet-button";
import type { z } from "zod";

type ProjectItem = z.infer<typeof projectItemSchema>;

type Props = {
  content: ProjectsContent;
  onChange: (content: ProjectsContent) => void;
};

export function ProjectsForm({ content, onChange }: Props) {
  return (
    <ItemListEditor<ProjectItem>
      items={content.items}
      onChange={(items) => onChange({ items })}
      createItem={() => ({
        id: crypto.randomUUID(),
        name: "",
        description: "",
        url: "",
        technologies: "",
      })}
      itemLabel={(item) => item.name}
      addLabel="Add project"
      emptyLabel="No projects added yet."
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
            <Label>URL</Label>
            <Input
              value={item.url}
              onChange={(e) => update({ url: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Technologies</Label>
            <Input
              value={item.technologies}
              onChange={(e) => update({ technologies: e.target.value })}
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
              context={item.name}
              onApply={(improved) => update({ description: improved })}
            />
          </div>
        </div>
      )}
    />
  );
}
