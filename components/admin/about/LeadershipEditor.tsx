import ArraySection from "../shared/ArraySection";
import FormField from "../shared/FormField";
import EntryForm from "./EntryForm";
import type { DynamicEntry, FieldDef, Leadership } from "./types";

interface LeadershipEditorProps {
  entries: Leadership[];
  subtitle: string;
  onEntriesChange: (entries: Leadership[]) => void;
  onSubtitleChange: (subtitle: string) => void;
}

const leadershipFields: FieldDef[] = [
  { key: "organization", label: "Organization", placeholder: "Organization name" },
  { key: "role", label: "Role", placeholder: "Your role" },
  { key: "startDate", label: "Start Date", type: "date" },
  { key: "endDate", label: "End Date", type: "date" },
  {
    key: "description",
    label: "Description (Markdown)",
    type: "markdown",
    placeholder: "Describe your responsibilities and accomplishments. Markdown is supported...",
  },
];

const blankLeadership = (): Leadership => ({
  organization: "",
  role: "",
  startDate: "",
  endDate: "",
  description: "",
});

/**
 * Leadership section. Wraps ArraySection with the new `header` slot to
 * keep the leadershipSubtitle field above the list of entries — that
 * field is the only reason this section couldn't use ArraySection
 * directly before step 6 of the AboutSettingsSection refactor.
 */
export default function LeadershipEditor({
  entries,
  subtitle,
  onEntriesChange,
  onSubtitleChange,
}: LeadershipEditorProps) {
  return (
    <ArraySection<Leadership>
      title="Leadership Experience"
      items={entries}
      onItemsChange={onEntriesChange}
      addNew={blankLeadership}
      header={
        <>
          <FormField
            label="Section Subtitle"
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder="Leading teams and driving organizational impact"
          />
          <p className="text-xs text-[var(--color-text-muted)] -mt-2">
            Displayed below the &quot;Leadership Experience&quot; heading. Leave empty to hide.
          </p>
        </>
      }
      renderItem={(entry, index, onChange, onRemove) => (
        <EntryForm
          key={index}
          entry={entry as DynamicEntry}
          index={index}
          onChange={(newItem) => onChange(newItem as Leadership)}
          onRemove={onRemove}
          fields={leadershipFields}
          entityName="Leadership"
        />
      )}
    />
  );
}
