import CollapsibleSection from "../shared/CollapsibleSection";
import { adminStyles } from "../shared/styles";
import type { Hobby } from "./types";

interface HobbiesEditorProps {
  hobbies: Hobby[];
  onChange: (hobbies: Hobby[]) => void;
}

const DEFAULT_HOBBY_COLOR = "#FAA307";

/**
 * Hobbies & Interests editor.
 *
 * Tolerates two stored shapes per the schema comment in
 * prisma/schema.prisma — `string` (legacy) and `{ name; color }` (current).
 * Reads coerce strings to display values; writes always emit objects.
 * The save endpoint (/api/admin/about) accepts either shape, so legacy
 * string entries stay strings on disk until first edit.
 */
export default function HobbiesEditor({ hobbies, onChange }: HobbiesEditorProps) {
  return (
    <CollapsibleSection
      title={`Hobbies & Interests (${hobbies.length})`}
      defaultOpen={hobbies.length > 0}
    >
      <div className="space-y-3">
        {hobbies.map((hobby, index) => {
          const hobbyName = typeof hobby === "string" ? hobby : hobby.name || "";
          const hobbyColor = typeof hobby === "string" ? "" : hobby.color || "";

          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-darker)]"
            >
              <input
                type="text"
                value={hobbyName}
                onChange={(e) => {
                  const newHobbies = [...hobbies];
                  newHobbies[index] = { name: e.target.value, color: hobbyColor };
                  onChange(newHobbies);
                }}
                placeholder="Hobby name"
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--color-text-muted)]">Color:</label>
                <input
                  type="color"
                  value={hobbyColor || DEFAULT_HOBBY_COLOR}
                  onChange={(e) => {
                    const newHobbies = [...hobbies];
                    newHobbies[index] = { name: hobbyName, color: e.target.value };
                    onChange(newHobbies);
                  }}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
              </div>
              <button
                type="button"
                onClick={() => onChange(hobbies.filter((_, i) => i !== index))}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
              >
                ✕
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => onChange([...hobbies, { name: "", color: DEFAULT_HOBBY_COLOR }])}
          className={`w-full py-2 ${adminStyles.buttonOutline}`}
        >
          + Add Hobby
        </button>
      </div>
    </CollapsibleSection>
  );
}
