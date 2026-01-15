/**
 * SectionsTab - Home page sections visibility management
 *
 * Allows enabling/disabling sections on the home page.
 * Hero and Welcome (GitHub) are required and always visible.
 */

import { adminStyles } from "../shared";

// Available sections for the home page
const AVAILABLE_SECTIONS = [
  { id: "hero", label: "Hero Section", description: "Main hero with typing animation", required: true },
  { id: "welcome", label: "GitHub Contributions", description: "Contribution graph and stats", required: true },
  { id: "projects", label: "Featured Projects", description: "Showcase of your best work", required: false },
  { id: "services", label: "Services", description: "Consulting services you offer", required: false },
  { id: "stats", label: "Quick Stats & Tech Stack", description: "Experience stats and technologies", required: false },
  { id: "articles", label: "Recent Activity", description: "Latest projects and articles timeline", required: false },
];

const DEFAULT_ENABLED_SECTIONS = ["hero", "welcome", "projects", "stats", "articles"];

export default function SectionsTab({
  enabledSections = DEFAULT_ENABLED_SECTIONS,
  setEnabledSections,
  saving,
  onSave,
}) {
  const handleToggle = (sectionId, isEnabled, isRequired) => {
    if (isRequired) return;
    
    const newSections = isEnabled
      ? [...enabledSections, sectionId]
      : enabledSections.filter((id) => id !== sectionId);
    
    setEnabledSections(newSections);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)]">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          Home Page Sections
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Choose which sections appear on your home page. Required sections cannot be disabled.
        </p>

        <div className="space-y-3">
          {AVAILABLE_SECTIONS.map((section) => {
            const isEnabled = enabledSections?.includes(section.id);
            return (
              <label
                key={section.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                  isEnabled
                    ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30"
                    : "bg-[var(--color-bg-card)] border-[var(--color-border)]"
                } ${section.required ? "opacity-80" : "hover:border-[var(--color-primary)]/50"}`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    disabled={section.required}
                    onChange={(e) => handleToggle(section.id, e.target.checked, section.required)}
                    className="w-5 h-5 rounded border-[var(--color-border)] bg-[var(--color-bg-darker)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-text-primary)] font-medium">
                      {section.label}
                    </span>
                    {section.required && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    {section.description}
                  </p>
                </div>
                {/* Visual indicator */}
                <div className={`w-2 h-2 rounded-full mt-2 ${isEnabled ? "bg-green-500" : "bg-gray-500"}`} />
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className={adminStyles.buttonPrimary}
        >
          {saving ? "Saving..." : "Save Sections"}
        </button>
        <p className="text-sm text-[var(--color-text-muted)]">
          Changes will appear on the home page after saving.
        </p>
      </div>
    </form>
  );
}

export { AVAILABLE_SECTIONS, DEFAULT_ENABLED_SECTIONS };

