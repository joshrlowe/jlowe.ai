import type { Dispatch, SetStateAction } from "react";
import { FormField, adminStyles } from "../shared";
import type { HomeContent, TechBadge } from "./types";

interface HeroTabProps {
  homeContent: HomeContent;
  setHomeContent: Dispatch<SetStateAction<HomeContent>>;
  saving: boolean;
  onSave: () => void;
}

export default function HeroTab({ homeContent, setHomeContent, saving, onSave }: HeroTabProps) {
  const cardClass = adminStyles.card;

  const addTypingString = () => {
    setHomeContent((prev) => ({
      ...prev,
      typingStrings: [...prev.typingStrings, ""],
    }));
  };

  const updateTypingString = (index: number, value: string) => {
    setHomeContent((prev) => ({
      ...prev,
      typingStrings: prev.typingStrings.map((s, i) => (i === index ? value : s)),
    }));
  };

  const removeTypingString = (index: number) => {
    setHomeContent((prev) => ({
      ...prev,
      typingStrings: prev.typingStrings.filter((_, i) => i !== index),
    }));
  };

  const addTechBadge = () => {
    setHomeContent((prev) => ({
      ...prev,
      techBadges: [...prev.techBadges, { name: "", color: "#E85D04" }],
    }));
  };

  const updateTechBadge = (index: number, field: keyof TechBadge, value: string) => {
    setHomeContent((prev) => ({
      ...prev,
      techBadges: prev.techBadges.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    }));
  };

  const removeTechBadge = (index: number) => {
    setHomeContent((prev) => ({
      ...prev,
      techBadges: prev.techBadges.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Typing Animation
        </h3>

        <div className="space-y-4">
          <FormField
            label="Intro Text (before typing)"
            value={homeContent.typingIntro}
            onChange={(e) =>
              setHomeContent({ ...homeContent, typingIntro: (e.target as HTMLInputElement).value })
            }
            placeholder="I build..."
          />

          <FormField
            label="Hero Title (main display)"
            value={homeContent.heroTitle}
            onChange={(e) =>
              setHomeContent({ ...homeContent, heroTitle: (e.target as HTMLInputElement).value })
            }
            placeholder="intelligent AI systems"
          />

          <div>
            <label className={adminStyles.label}>Typing Strings (rotate through)</label>
            <div className="space-y-2">
              {homeContent.typingStrings.map((str, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={str}
                    onChange={(e) => updateTypingString(index, e.target.value)}
                    className={`${adminStyles.input} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removeTypingString(index)}
                    className={adminStyles.buttonDanger}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addTypingString}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)]/20 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/30 transition-colors"
              >
                + Add String
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Call to Action Buttons
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Primary CTA Text"
            value={homeContent.primaryCta?.text || ""}
            onChange={(e) =>
              setHomeContent({
                ...homeContent,
                primaryCta: {
                  ...homeContent.primaryCta,
                  text: (e.target as HTMLInputElement).value,
                },
              })
            }
            placeholder="Start a Project"
          />
          <FormField
            label="Primary CTA Link"
            value={homeContent.primaryCta?.href || ""}
            onChange={(e) =>
              setHomeContent({
                ...homeContent,
                primaryCta: {
                  ...homeContent.primaryCta,
                  href: (e.target as HTMLInputElement).value,
                },
              })
            }
            placeholder="/contact"
          />
          <FormField
            label="Secondary CTA Text"
            value={homeContent.secondaryCta?.text || ""}
            onChange={(e) =>
              setHomeContent({
                ...homeContent,
                secondaryCta: {
                  ...homeContent.secondaryCta,
                  text: (e.target as HTMLInputElement).value,
                },
              })
            }
            placeholder="View My Work"
          />
          <FormField
            label="Secondary CTA Link"
            value={homeContent.secondaryCta?.href || ""}
            onChange={(e) =>
              setHomeContent({
                ...homeContent,
                secondaryCta: {
                  ...homeContent.secondaryCta,
                  href: (e.target as HTMLInputElement).value,
                },
              })
            }
            placeholder="/projects"
          />
        </div>
      </div>

      <div className={cardClass}>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Tech Badges</h3>

        <div className="space-y-3">
          {homeContent.techBadges.map((badge, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                value={badge.name}
                onChange={(e) => updateTechBadge(index, "name", e.target.value)}
                className={`${adminStyles.input} flex-1`}
                placeholder="Technology name"
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={badge.color}
                  onChange={(e) => updateTechBadge(index, "color", e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <span
                  className="px-3 py-1 text-sm rounded-full"
                  style={{
                    background: `${badge.color}15`,
                    color: badge.color,
                    border: `1px solid ${badge.color}30`,
                  }}
                >
                  {badge.name || "Preview"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeTechBadge(index)}
                className={adminStyles.buttonDanger}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTechBadge}
            className="px-4 py-2 rounded-lg bg-[var(--color-primary)]/20 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/30 transition-colors"
          >
            + Add Badge
          </button>
        </div>
      </div>

      <button onClick={onSave} disabled={saving} className={adminStyles.buttonPrimary}>
        {saving ? "Saving..." : "Save Hero Content"}
      </button>
    </div>
  );
}
