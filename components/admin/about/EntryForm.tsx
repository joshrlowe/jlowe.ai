import FormField from "../shared/FormField";
import TagInput from "../shared/TagInput";
import { adminStyles } from "../shared/styles";
import MarkdownEditor from "../MarkdownEditor";
import type { DynamicEntry, FieldDef } from "./types";

interface EntryFormProps {
  entry: DynamicEntry;
  onChange: (entry: DynamicEntry) => void;
  onRemove: () => void;
  fields: FieldDef[];
  index: number;
  entityName?: string;
}

/**
 * Field-def-driven generic entry editor used by Certifications and
 * Leadership inside AboutSettingsSection. Sole consumer right now; keep
 * co-located in about/ until a third caller arrives.
 */
export default function EntryForm({
  entry,
  onChange,
  onRemove,
  fields,
  index,
  entityName = "Entry",
}: EntryFormProps) {
  const handleFieldChange = (field: string, value: unknown) => {
    onChange({ ...entry, [field]: value });
  };

  return (
    <div className={adminStyles.card}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          {entityName} #{index + 1}
        </span>
        <button type="button" onClick={onRemove} className={adminStyles.buttonDangerOutline}>
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          if (field.type === "achievements" || field.type === "tags") {
            return (
              <div key={field.key} className="md:col-span-2">
                <TagInput
                  label={field.label}
                  tags={entry[field.key] || []}
                  onAdd={(tag) => handleFieldChange(field.key, [...(entry[field.key] || []), tag])}
                  onRemove={(idx) =>
                    handleFieldChange(
                      field.key,
                      (entry[field.key] || []).filter((_: unknown, i: number) => i !== idx)
                    )
                  }
                  placeholder={field.placeholder || "Add item"}
                />
              </div>
            );
          }
          if (field.type === "textarea") {
            return (
              <div key={field.key} className="md:col-span-2">
                <FormField
                  label={field.label}
                  value={entry[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  rows={3}
                  placeholder={field.placeholder}
                />
              </div>
            );
          }
          if (field.type === "markdown") {
            return (
              <div key={field.key} className="md:col-span-2">
                <MarkdownEditor
                  label={field.label}
                  value={entry[field.key] || ""}
                  onChange={(value) => handleFieldChange(field.key, value)}
                  rows={4}
                  placeholder={field.placeholder}
                />
              </div>
            );
          }
          return (
            <FormField
              key={field.key}
              label={field.label}
              type={field.type || "text"}
              value={entry[field.key] || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          );
        })}
      </div>
    </div>
  );
}
