/**
 * GitHubTab - GitHub section editing tab
 *
 * Allows editing the GitHub contributions section title and description
 */

import { FormField, adminStyles } from "../shared";

export default function GitHubTab({
  homeContent,
  setHomeContent,
  saving,
  onSave,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)]">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          GitHub Contributions Section
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          Customize the header and description shown above the GitHub contribution graph.
        </p>

        <div className="space-y-4">
          <FormField
            label="Section Title"
            value={homeContent.githubSectionTitle || ""}
            onChange={(e) =>
              setHomeContent({ ...homeContent, githubSectionTitle: e.target.value })
            }
            placeholder="e.g., GitHub Contributions"
          />

          <FormField
            label="Section Description"
            value={homeContent.githubSectionDescription || ""}
            onChange={(e) =>
              setHomeContent({ ...homeContent, githubSectionDescription: e.target.value })
            }
            placeholder="A brief description of your coding activity..."
            rows={3}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className={adminStyles.buttonPrimary}
      >
        {saving ? "Saving..." : "Save GitHub Section"}
      </button>
    </form>
  );
}

