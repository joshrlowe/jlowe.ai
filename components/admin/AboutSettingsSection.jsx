import { useState, useEffect } from "react";
import { useToast } from "./ToastProvider";

export default function AboutSettingsSection({ onError }) {
  const { showToast } = useToast();
  const [aboutData, setAboutData] = useState({
    professionalSummary: "",
    technicalSkills: [],
    professionalExperience: [],
    education: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const res = await fetch("/api/about");
      const data = await res.json();
      setAboutData({
        professionalSummary: data.professionalSummary || "",
        technicalSkills: data.technicalSkills || [],
        professionalExperience: data.professionalExperience || [],
        education: data.education || [],
      });
    } catch (error) {
      onError("Failed to load about page data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aboutData),
      });

      if (!res.ok) throw new Error("Failed to save");

      showToast("About page settings saved!", "success");
    } catch (error) {
      showToast("Failed to save settings", "error");
      onError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Professional Summary (HTML supported)
        </label>
        <textarea
          rows={6}
          value={aboutData.professionalSummary}
          onChange={(e) =>
            setAboutData({ ...aboutData, professionalSummary: e.target.value })
          }
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none font-mono text-sm"
        />
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">
        Note: Technical skills, professional experience, and education are
        stored as JSON arrays. Advanced editing of these fields should be done
        via the API or database.
      </p>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
