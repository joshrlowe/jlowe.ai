import { useState, useEffect, useCallback } from "react";
import { useToast } from "./ToastProvider";

// Available sections for the home page
const AVAILABLE_SECTIONS = [
  { id: "hero", label: "Hero Section", required: true },
  { id: "welcome", label: "Welcome Message", required: true },
  { id: "services", label: "Services", required: false },
  { id: "projects", label: "Featured Projects", required: false },
  { id: "stats", label: "Quick Stats", required: false },
  { id: "articles", label: "Recent Articles", required: false },
];

const DEFAULT_ENABLED_SECTIONS = ["hero", "welcome", "projects", "stats", "articles"];

export default function GlobalSettingsSection({ onError }) {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    siteName: "",
    footerText: "",
    navLinks: [],
    enabledSections: DEFAULT_ENABLED_SECTIONS,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/site-settings");
      const data = await res.json();
      setSettings({
        siteName: data.siteName || "",
        footerText: data.footerText || "",
        navLinks: data.navLinks || [],
        seoDefaults: data.seoDefaults || {},
        enabledSections: data.enabledSections || DEFAULT_ENABLED_SECTIONS,
      });
    } catch (_error) {
      onError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save");

      setMessage("Settings saved successfully!");
      showToast("Settings saved successfully!", "success");
      setTimeout(() => setMessage(""), 3000);
    } catch (_error) {
      showToast("Failed to save settings", "error");
      onError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addNavLink = () => {
    setSettings({
      ...settings,
      navLinks: [
        ...settings.navLinks,
        { label: "", href: "", order: settings.navLinks.length },
      ],
    });
  };

  const removeNavLink = (index) => {
    setSettings({
      ...settings,
      navLinks: settings.navLinks.filter((_, i) => i !== index),
    });
  };

  const updateNavLink = (index, field, value) => {
    const updated = [...settings.navLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSettings({ ...settings, navLinks: updated });
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
      {message && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
          {message}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Site Name
        </label>
        <input
          type="text"
          value={settings.siteName}
          onChange={(e) =>
            setSettings({ ...settings, siteName: e.target.value })
          }
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Footer Text
        </label>
        <textarea
          rows={3}
          value={settings.footerText}
          onChange={(e) =>
            setSettings({ ...settings, footerText: e.target.value })
          }
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
        />
      </div>

      {/* Home Page Sections */}
      <div className="p-4 rounded-lg bg-[var(--color-bg-darker)]">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          Home Page Sections
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Enable or disable sections on the home page
        </p>
        <div className="space-y-3">
          {AVAILABLE_SECTIONS.map((section) => {
            const isEnabled = settings.enabledSections?.includes(section.id);
            return (
              <label
                key={section.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  isEnabled
                    ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30"
                    : "bg-[var(--color-bg-card)] border-[var(--color-border)]"
                } ${section.required ? "opacity-75" : "hover:border-[var(--color-primary)]/50"}`}
              >
                <input
                  type="checkbox"
                  checked={isEnabled}
                  disabled={section.required}
                  onChange={(e) => {
                    if (section.required) return;
                    const newSections = e.target.checked
                      ? [...(settings.enabledSections || []), section.id]
                      : (settings.enabledSections || []).filter((id) => id !== section.id);
                    setSettings({ ...settings, enabledSections: newSections });
                  }}
                  className="w-5 h-5 rounded border-[var(--color-border)] bg-[var(--color-bg-darker)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <span className="text-[var(--color-text-primary)] font-medium">
                    {section.label}
                  </span>
                  {section.required && (
                    <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                      (required)
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="p-4 rounded-lg bg-[var(--color-bg-darker)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Navigation Links
          </h3>
          <button
            type="button"
            onClick={addNavLink}
            className="px-3 py-1 text-sm rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
          >
            Add Link
          </button>
        </div>
        <div className="space-y-3">
          {settings.navLinks.map((link, index) => (
            <div key={index} className="flex gap-2">
              <input
                placeholder="Label"
                value={link.label}
                onChange={(e) => updateNavLink(index, "label", e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <input
                placeholder="URL"
                value={link.href}
                onChange={(e) => updateNavLink(index, "href", e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <button
                type="button"
                onClick={() => removeNavLink(index)}
                className="px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

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
