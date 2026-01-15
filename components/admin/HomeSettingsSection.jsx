/**
 * HomeSettingsSection - Admin UI for editing home page content
 *
 * Refactoring Applied:
 * - Extract Component: WelcomeTab, HeroTab, ServicesTab
 * - Extract Constants: ICON_OPTIONS, VARIANT_OPTIONS → shared/constants
 * - Encapsulate Variable: adminStyles for CSS classes
 *
 * Reduced from 630 lines to ~120 lines (~80% reduction)
 */

import { useState, useEffect, useCallback } from "react";
import { useToast } from "./ToastProvider";
import { LoadingSpinner, adminStyles } from "./shared";
import { WelcomeTab, HeroTab, ServicesTab, GitHubTab } from "./home";

const TABS = [
  { key: "welcome", label: "Welcome Info" },
  { key: "hero", label: "Hero Section" },
  { key: "github", label: "GitHub Section" },
  { key: "services", label: "Services" },
];

export default function HomeSettingsSection({ onError }) {
  const { showToast } = useToast();

  // Welcome data (existing)
  const [welcomeData, setWelcomeData] = useState({
    name: "",
    briefBio: "",
    callToAction: "",
  });

  // Home page content (new)
  const [homeContent, setHomeContent] = useState({
    typingIntro: "I build...",
    heroTitle: "intelligent AI systems",
    typingStrings: [],
    primaryCta: { text: "", href: "" },
    secondaryCta: { text: "", href: "" },
    techBadges: [],
    githubSectionTitle: "GitHub Contributions",
    githubSectionDescription: "A visual representation of my coding journey. Every square represents a day of building, learning, and shipping.",
    servicesTitle: "",
    servicesSubtitle: "",
    services: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("welcome");

  const fetchAllData = useCallback(async () => {
    try {
      // Fetch welcome data
      const welcomeRes = await fetch("/api/welcome");
      if (welcomeRes.ok) {
        const data = await welcomeRes.json();
        setWelcomeData({
          name: data.name || "",
          briefBio: data.briefBio || "",
          callToAction: data.callToAction || "",
        });
      }

      // Fetch home content
      const contentRes = await fetch("/api/admin/page-content?pageKey=home");
      if (contentRes.ok) {
        const data = await contentRes.json();
        if (data.content) {
          setHomeContent((prev) => ({ ...prev, ...data.content }));
        }
      }
    } catch (_error) {
      onError("Failed to load home page data");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleSaveWelcome = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/welcome", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(welcomeData),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("Welcome data saved!", "success");
    } catch (_error) {
      showToast("Failed to save welcome data", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContent = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/page-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageKey: "home",
          content: homeContent,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("Home content saved!", "success");
    } catch (_error) {
      showToast("Failed to save content", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-[var(--color-border)] pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? adminStyles.tabActive
                : adminStyles.tabInactive
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "welcome" && (
        <WelcomeTab
          welcomeData={welcomeData}
          setWelcomeData={setWelcomeData}
          saving={saving}
          onSave={handleSaveWelcome}
        />
      )}

      {activeTab === "hero" && (
        <HeroTab
          homeContent={homeContent}
          setHomeContent={setHomeContent}
          saving={saving}
          onSave={handleSaveContent}
        />
      )}

      {activeTab === "github" && (
        <GitHubTab
          homeContent={homeContent}
          setHomeContent={setHomeContent}
          saving={saving}
          onSave={handleSaveContent}
        />
      )}

      {activeTab === "services" && (
        <ServicesTab
          homeContent={homeContent}
          setHomeContent={setHomeContent}
          saving={saving}
          onSave={handleSaveContent}
        />
      )}
    </div>
  );
}
