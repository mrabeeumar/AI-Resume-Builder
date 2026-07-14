import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props<Item extends { id: string }> = {
  items: Item[];
  onChange: (items: Item[]) => void;
  createItem: () => Item;
  renderFields: (
    item: Item,
    update: (patch: Partial<Item>) => void,
  ) => React.ReactNode;
  itemLabel: (item: Item) => string;
  addLabel: string;
  emptyLabel: string;
};

export function ItemListEditor<Item extends { id: string }>({
  items,
  onChange,
  createItem,
  renderFields,
  itemLabel,
  addLabel,
  emptyLabel,
}: Props<Item>) {
  const handleAdd = () => {
    onChange([...items, createItem()]);
  };

  const handleRemove = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleUpdate = (id: string, patch: Partial<Item>) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{emptyLabel}</p>
      ) : (
        items.map((item) => (
          <Card key={item.id} className="gap-3 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                {itemLabel(item) || "Untitled"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(item.id)}
              >
                Remove
              </Button>
            </div>
            {renderFields(item, (patch) => handleUpdate(item.id, patch))}
          </Card>
        ))
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="self-start"
      >
        {addLabel}
      </Button>
    </div>
  );
}
