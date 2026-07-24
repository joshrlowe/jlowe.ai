import FormField from "../shared/FormField";
import TagInput from "../shared/TagInput";
import { adminStyles } from "../shared/styles";
import type { Education } from "./types";

interface EducationEntryFormProps {
  entry: Education;
  onChange: (entry: Education) => void;
  onRemove: () => void;
  index: number;
}

/**
 * Education card with an Ongoing toggle that switches the end-date
 * field between Expected Graduation (when enrolled) and End Date
 * (when complete). Preserves all data-testid values asserted by
 * __tests__/components/AboutSettingsSection.test.jsx.
 */
export default function EducationEntryForm({
  entry,
  onChange,
  onRemove,
  index,
}: EducationEntryFormProps) {
  const handleFieldChange = <K extends keyof Education>(field: K, value: Education[K]) => {
    onChange({ ...entry, [field]: value });
  };

  const handleOngoingToggle = (checked: boolean) => {
    const updates: Partial<Education> = { isOngoing: checked };
    if (checked) {
      updates.endDate = "";
    } else {
      updates.expectedGradDate = "";
    }
    onChange({ ...entry, ...updates });
  };

  const isOngoing = entry.isOngoing || false;

  return (
    <div className={adminStyles.card} data-testid={`education-entry-${index}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          Education #{index + 1}
        </span>
        <button type="button" onClick={onRemove} className={adminStyles.buttonDangerOutline}>
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Institution"
          value={entry.institution || ""}
          onChange={(e) => handleFieldChange("institution", e.target.value)}
          placeholder="University or school name"
        />
        <FormField
          label="Degree"
          value={entry.degree || ""}
          onChange={(e) => handleFieldChange("degree", e.target.value)}
          placeholder="e.g., Bachelor of Science"
        />
        <FormField
          label="Field of Study"
          value={entry.fieldOfStudy || ""}
          onChange={(e) => handleFieldChange("fieldOfStudy", e.target.value)}
          placeholder="e.g., Computer Science"
        />
        <FormField
          label="Start Date"
          type="date"
          value={entry.startDate || ""}
          onChange={(e) => handleFieldChange("startDate", e.target.value)}
        />

        {/* End Date / Expected Graduation with Ongoing Toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={adminStyles.label} style={{ marginBottom: 0 }}>
              {isOngoing ? "Expected Graduation" : "End Date"}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOngoing}
                onChange={(e) => handleOngoingToggle(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-darker)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-0 cursor-pointer"
                data-testid={`education-ongoing-checkbox-${index}`}
              />
              <span className="text-sm text-[var(--color-text-secondary)]">Currently Enrolled</span>
            </label>
          </div>
          {isOngoing ? (
            <input
              type="date"
              value={entry.expectedGradDate || ""}
              onChange={(e) => handleFieldChange("expectedGradDate", e.target.value)}
              className={adminStyles.input}
              placeholder="Expected graduation date"
              data-testid={`education-expected-grad-${index}`}
            />
          ) : (
            <input
              type="date"
              value={entry.endDate || ""}
              onChange={(e) => handleFieldChange("endDate", e.target.value)}
              className={adminStyles.input}
              required={!isOngoing}
              data-testid={`education-end-date-${index}`}
            />
          )}
          {isOngoing && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Leave empty if graduation date is unknown
            </p>
          )}
        </div>

        {/* Relevant Coursework */}
        <div className="md:col-span-2">
          <TagInput
            label="Relevant Coursework"
            tags={entry.relevantCoursework || []}
            onAdd={(course) =>
              handleFieldChange("relevantCoursework", [...(entry.relevantCoursework || []), course])
            }
            onRemove={(idx) =>
              handleFieldChange(
                "relevantCoursework",
                (entry.relevantCoursework || []).filter((_, i) => i !== idx)
              )
            }
            placeholder="Add course name"
          />
        </div>
      </div>
    </div>
  );
}
