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
      <FormField
        label="Name"
        value={welcomeData.name}
        onChange={(e) =>
          setWelcomeData({ ...welcomeData, name: e.target.value })
        }
      />

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
