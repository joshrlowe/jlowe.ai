import { useState, useEffect } from "react";
import { useToast } from "./ToastProvider";

export default function ContactSettingsSection({ onError }) {
  const { showToast } = useToast();
  const [contactData, setContactData] = useState({
    emailAddress: "",
    phoneNumber: "",
    address: "",
    availability: { workingHours: "" },
    socialMediaLinks: { linkedIn: "", github: "", X: "" },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContactData();
  }, []);

  const fetchContactData = async () => {
    try {
      const res = await fetch("/api/contact");
      const data = await res.json();
      setContactData({
        emailAddress: data.emailAddress || "",
        phoneNumber: data.phoneNumber || "",
        address: data.address || "",
        availability: data.availability || { workingHours: "" },
        socialMediaLinks: data.socialMediaLinks || {
          linkedIn: "",
          github: "",
          X: "",
        },
      });
    } catch (error) {
      onError("Failed to load contact data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });

      if (!res.ok) throw new Error("Failed to save");

      showToast("Contact settings saved!", "success");
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
          Email Address
        </label>
        <input
          type="email"
          value={contactData.emailAddress}
          onChange={(e) =>
            setContactData({ ...contactData, emailAddress: e.target.value })
          }
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          value={contactData.phoneNumber}
          onChange={(e) =>
            setContactData({ ...contactData, phoneNumber: e.target.value })
          }
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Address
        </label>
        <input
          type="text"
          value={contactData.address}
          onChange={(e) =>
            setContactData({ ...contactData, address: e.target.value })
          }
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Working Hours
        </label>
        <input
          type="text"
          value={contactData.availability?.workingHours || ""}
          onChange={(e) =>
            setContactData({
              ...contactData,
              availability: {
                ...contactData.availability,
                workingHours: e.target.value,
              },
            })
          }
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      {/* Social Media Links */}
      <div className="p-4 rounded-lg bg-[var(--color-bg-darker)]">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Social Media Links
        </h3>
        <div className="space-y-4">
          {["linkedIn", "github", "X"].map((platform) => (
            <div key={platform}>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1 capitalize">
                {platform === "X" ? "X (Twitter)" : platform}
              </label>
              <input
                type="text"
                value={contactData.socialMediaLinks?.[platform] || ""}
                onChange={(e) =>
                  setContactData({
                    ...contactData,
                    socialMediaLinks: {
                      ...contactData.socialMediaLinks,
                      [platform]: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
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
