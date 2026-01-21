import { useState, useEffect, useCallback } from "react";
import { useToast } from "./ToastProvider";

export default function GlobalSettingsSection({ onError }) {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    ownerName: "",
    siteName: "",
    footerText: "",
    footerTitle: "",
    navLinks: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/site-settings");
      const data = await res.json();
      setSettings({
        ownerName: data.ownerName || "",
        siteName: data.siteName || "",
        footerText: data.footerText || "",
        footerTitle: data.footerTitle || "",
        navLinks: data.navLinks || [],
        seoDefaults: data.seoDefaults || {},
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
      showToast("Settings saved!", "success");
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
          Owner Name
        </label>
        <input
          type="text"
          value={settings.ownerName}
          onChange={(e) =>
            setSettings({ ...settings, ownerName: e.target.value })
          }
          placeholder="e.g., Josh Lowe"
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Your name as displayed on the About page and other places across the site.
        </p>
      </div>

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
          Footer Title/Role
        </label>
        <input
          type="text"
          value={settings.footerTitle}
          onChange={(e) =>
            setSettings({ ...settings, footerTitle: e.target.value })
          }
          placeholder="e.g., AI Engineer & Consultant"
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Your title or role displayed in the footer below your name.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Footer Description
        </label>
        <textarea
          rows={3}
          value={settings.footerText}
          onChange={(e) =>
            setSettings({ ...settings, footerText: e.target.value })
          }
          placeholder="e.g., Building intelligent systems and production-grade AI applications..."
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          A brief description displayed in the footer.
        </p>
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
