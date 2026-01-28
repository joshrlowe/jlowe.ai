import { useState, useEffect, useCallback } from "react";
import { useToast } from "./ToastProvider";

const DEFAULT_HERO_WORDS = ["Amazing", "Innovative", "Momentous"];

export default function ContactSettingsSection({ onError }) {
  const { showToast } = useToast();
  const [contactData, setContactData] = useState({
    emailAddress: "",
    phoneNumber: "",
    socialMediaLinks: { linkedIn: "", github: "", X: "", handshake: "" },
    heroWords: DEFAULT_HERO_WORDS,
    heroSubtitle: "",
  });
  const [heroWordInput, setHeroWordInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchContactData = useCallback(async () => {
    try {
      const res = await fetch("/api/contact");
      const data = await res.json();
      setContactData({
        emailAddress: data.emailAddress || "",
        phoneNumber: data.phoneNumber || "",
        socialMediaLinks: data.socialMediaLinks || {
          linkedIn: "",
          github: "",
          X: "",
          handshake: "",
        },
        heroWords: data.heroWords || DEFAULT_HERO_WORDS,
        heroSubtitle: data.heroSubtitle || "",
      });
    } catch (_error) {
      onError("Failed to load contact data");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchContactData();
  }, [fetchContactData]);

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
    } catch (_error) {
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

      {/* Hero Subtitle */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Hero Subtitle
        </label>
        <textarea
          value={contactData.heroSubtitle}
          onChange={(e) =>
            setContactData({ ...contactData, heroSubtitle: e.target.value })
          }
          placeholder="Ready to bring AI to your business? I'd love to hear about your project and explore how we can work together."
          rows={3}
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Text displayed below "Let's Build Something ___" on the contact page
        </p>
      </div>

      {/* Hero Words Carousel */}
      <div className="p-4 rounded-lg bg-[var(--color-bg-darker)]">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          Hero Carousel Words
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Words that rotate in "Let's Build Something ___" on the contact page
        </p>
        
        {/* Current words */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(contactData.heroWords || []).map((word, index) => (
            <span
              key={index}
              className="px-3 py-1.5 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-sm flex items-center gap-2"
            >
              {word}
              <button
                type="button"
                onClick={() => {
                  const newWords = [...contactData.heroWords];
                  newWords.splice(index, 1);
                  setContactData({ ...contactData, heroWords: newWords });
                }}
                className="hover:text-white transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        
        {/* Add new word */}
        <div className="flex gap-2">
          <input
            type="text"
            value={heroWordInput}
            onChange={(e) => setHeroWordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (heroWordInput.trim()) {
                  setContactData({
                    ...contactData,
                    heroWords: [...(contactData.heroWords || []), heroWordInput.trim()],
                  });
                  setHeroWordInput("");
                }
              }
            }}
            placeholder="Add a word (e.g., Extraordinary)"
            className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
          />
          <button
            type="button"
            onClick={() => {
              if (heroWordInput.trim()) {
                setContactData({
                  ...contactData,
                  heroWords: [...(contactData.heroWords || []), heroWordInput.trim()],
                });
                setHeroWordInput("");
              }
            }}
            className="px-4 py-2 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Social Media Links */}
      <div className="p-4 rounded-lg bg-[var(--color-bg-darker)]">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Social Media Links
        </h3>
        <div className="space-y-4">
          {["linkedIn", "github", "X", "handshake"].map((platform) => (
            <div key={platform}>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1 capitalize">
                {platform === "X" ? "X (Twitter)" : platform === "handshake" ? "Handshake" : platform}
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
