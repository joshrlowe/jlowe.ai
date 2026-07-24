import FormField from "../shared/FormField";
import MarkdownEditor from "../MarkdownEditor";
import { adminStyles } from "../shared/styles";
import type { Experience } from "./types";

interface ExperienceEntryFormProps {
  entry: Experience;
  onChange: (entry: Experience) => void;
  onRemove: () => void;
  index: number;
}

/**
 * Professional Experience card with an Ongoing toggle that swaps the
 * End Date input for a "Present" affordance. Preserves all data-testid
 * values asserted by __tests__/components/AboutSettingsSection.test.jsx.
 */
export default function ExperienceEntryForm({
  entry,
  onChange,
  onRemove,
  index,
}: ExperienceEntryFormProps) {
  const handleFieldChange = <K extends keyof Experience>(field: K, value: Experience[K]) => {
    onChange({ ...entry, [field]: value });
  };

  const handleOngoingToggle = (checked: boolean) => {
    const updates: Partial<Experience> = { isOngoing: checked };
    if (checked) {
      updates.endDate = "";
    }
    onChange({ ...entry, ...updates });
  };

  const isOngoing = entry.isOngoing || false;

  return (
    <div className={adminStyles.card}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          Experience #{index + 1}
        </span>
        <button type="button" onClick={onRemove} className={adminStyles.buttonDangerOutline}>
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Company"
          value={entry.company || ""}
          onChange={(e) => handleFieldChange("company", e.target.value)}
          placeholder="Company name"
        />
        <FormField
          label="Role/Title"
          value={entry.role || ""}
          onChange={(e) => handleFieldChange("role", e.target.value)}
          placeholder="Your role"
        />
        <div className="md:col-span-2">
          <MarkdownEditor
            label="Description (Markdown)"
            value={entry.description || ""}
            onChange={(value) => handleFieldChange("description", value)}
            rows={4}
            placeholder="Describe your responsibilities and accomplishments. Markdown is supported..."
          />
        </div>
        <FormField
          label="Start Date"
          type="date"
          value={entry.startDate || ""}
          onChange={(e) => handleFieldChange("startDate", e.target.value)}
        />
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={adminStyles.label} style={{ marginBottom: 0 }}>
              End Date
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOngoing}
                onChange={(e) => handleOngoingToggle(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-darker)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-0 cursor-pointer"
                data-testid="ongoing-checkbox"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">Ongoing</span>
            </label>
          </div>
          {isOngoing ? (
            <div
              className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-muted)] italic"
              data-testid="ongoing-indicator"
            >
              Present
            </div>
          ) : (
            <input
              type="date"
              value={entry.endDate || ""}
              onChange={(e) => handleFieldChange("endDate", e.target.value)}
              className={adminStyles.input}
              required={!isOngoing}
              data-testid="end-date-input"
            />
          )}
        </div>
      </div>
    </div>
  );
}
