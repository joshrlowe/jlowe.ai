import type { ReactNode } from "react";
import CollapsibleSection from "./CollapsibleSection";
import { adminStyles } from "./styles";

interface ArraySectionProps<T> {
  title: string;
  items: T[];
  onItemsChange: (items: T[]) => void;
  renderItem: (
    item: T,
    index: number,
    onChange: (newItem: T) => void,
    onRemove: () => void
  ) => ReactNode;
  addNew: () => T;
  /** Optional content rendered above the list (e.g. a subtitle field). */
  header?: ReactNode;
  /** Override the auto-open behaviour (defaults to: open if items.length > 0). */
  defaultOpen?: boolean;
}

/**
 * Collapsible list-of-cards primitive used across admin SettingsSections.
 *
 * Generic over the item shape; pass a `renderItem` to draw each card and
 * `addNew` to mint blank items. Pass `header` when a section needs a
 * non-list field above the items (e.g. Leadership subtitle).
 */
export default function ArraySection<T>({
  title,
  items,
  onItemsChange,
  renderItem,
  addNew,
  header,
  defaultOpen,
}: ArraySectionProps<T>) {
  const handleAdd = () => onItemsChange([...items, addNew()]);
  const handleRemove = (index: number) => onItemsChange(items.filter((_, i) => i !== index));
  const handleChange = (index: number, newItem: T) => {
    const newItems = [...items];
    newItems[index] = newItem;
    onItemsChange(newItems);
  };

  return (
    <CollapsibleSection
      title={`${title} (${items.length})`}
      defaultOpen={defaultOpen ?? items.length > 0}
    >
      <div className="space-y-4">
        {header}
        {items.map((item, index) =>
          renderItem(
            item,
            index,
            (newItem) => handleChange(index, newItem),
            () => handleRemove(index)
          )
        )}
        <button
          type="button"
          onClick={handleAdd}
          className={`w-full py-2 ${adminStyles.buttonOutline}`}
        >
          + Add {title.replace(/ies$/, "y").replace(/s$/, "")}
        </button>
      </div>
    </CollapsibleSection>
  );
}
