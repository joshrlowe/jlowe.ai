/**
 * WelcomeTab - Welcome info editing tab
 *
 * Refactoring: Extract Component from HomeSettingsSection
 */

import { FormField, adminStyles } from "../shared";

export default function WelcomeTab({
  welcomeData,
  setWelcomeData,
  saving,
  onSave,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <FormField
          label="Featured Title"
          value={welcomeData.name}
          onChange={(e) =>
            setWelcomeData({ ...welcomeData, name: e.target.value })
          }
          placeholder="e.g., MSCS Student @ UCF"
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Displayed prominently on the home page hero. Your actual name is set in Global Site Settings.
        </p>
      </div>

      <FormField
        label="Tagline / Role"
        value={welcomeData.callToAction}
        onChange={(e) =>
          setWelcomeData({ ...welcomeData, callToAction: e.target.value })
        }
        placeholder="e.g., AI Engineer & Consultant"
      />

      <FormField
        label="Brief Bio"
        value={welcomeData.briefBio}
        onChange={(e) =>
          setWelcomeData({ ...welcomeData, briefBio: e.target.value })
        }
        rows={4}
      />

      <button
        type="submit"
        disabled={saving}
        className={adminStyles.buttonPrimary}
      >
        {saving ? "Saving..." : "Save Welcome Info"}
      </button>
    </form>
  );
}
