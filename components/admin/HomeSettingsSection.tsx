import { useState, useEffect, useCallback } from "react";
import { useToast } from "./ToastProvider";
import { LoadingSpinner, adminStyles } from "./shared";
import { WelcomeTab, HeroTab, GitHubTab } from "./home";
import type { HomeContent, WelcomeData } from "./home/types";

const TABS = [
  { key: "hero", label: "Hero Section" },
  { key: "welcome", label: "Welcome Info" },
  { key: "github", label: "GitHub Section" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface HomeSettingsSectionProps {
  onError: (msg: string) => void;
}

export default function HomeSettingsSection({ onError }: HomeSettingsSectionProps) {
  const { showToast } = useToast();

  const [welcomeData, setWelcomeData] = useState<WelcomeData>({
    name: "",
    briefBio: "",
    callToAction: "",
  });

  const [homeContent, setHomeContent] = useState<HomeContent>({
    typingIntro: "I build...",
    heroTitle: "intelligent AI systems",
    typingStrings: [],
    primaryCta: { text: "", href: "" },
    secondaryCta: { text: "", href: "" },
    techBadges: [],
    githubSectionTitle: "GitHub Contributions",
    githubSectionDescription:
      "A visual representation of my coding journey. Every square represents a day of building, learning, and shipping.",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("hero");

  const fetchAllData = useCallback(async () => {
    try {
      const welcomeRes = await fetch("/api/welcome");
      if (welcomeRes.ok) {
        const data = await welcomeRes.json();
        setWelcomeData({
          name: data.name || "",
          briefBio: data.briefBio || "",
          callToAction: data.callToAction || "",
        });
      }

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
      <div className="flex gap-2 border-b border-[var(--color-border)] pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={activeTab === tab.key ? adminStyles.tabActive : adminStyles.tabInactive}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
    </div>
  );
}
