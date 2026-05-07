import type { Dispatch, FormEvent, SetStateAction } from "react";
import { FormField, adminStyles } from "../shared";
import type { HomeContent } from "./types";

interface GitHubTabProps {
  homeContent: HomeContent;
  setHomeContent: Dispatch<SetStateAction<HomeContent>>;
  saving: boolean;
  onSave: () => void;
}

export default function GitHubTab({
  homeContent,
  setHomeContent,
  saving,
  onSave,
}: GitHubTabProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
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
              setHomeContent({ ...homeContent, githubSectionTitle: (e.target as HTMLInputElement).value })
            }
            placeholder="e.g., GitHub Contributions"
          />

          <FormField
            label="Section Description"
            value={homeContent.githubSectionDescription || ""}
            onChange={(e) =>
              setHomeContent({ ...homeContent, githubSectionDescription: (e.target as HTMLTextAreaElement).value })
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
