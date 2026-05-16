/**
 * AboutSettingsSection - Comprehensive About page editor
 *
 * Provides full editing capabilities for:
 * - Professional Summary (Markdown)
 * - Technical Skills (categorized list)
 * - Professional Experience (timeline entries)
 * - Education (academic history)
 * - Technical Certifications
 * - Leadership Experience
 * - Hobbies
 */

import { ChangeEvent, FormEvent, ReactNode, useState, useEffect, useCallback } from "react";
import { useToast } from "./ToastProvider";
import MarkdownEditor from "./MarkdownEditor";
import ArraySection from "./shared/ArraySection";
import CollapsibleSection from "./shared/CollapsibleSection";
import FormField from "./shared/FormField";
import TagInput from "./shared/TagInput";
import { adminStyles } from "./shared/styles";
import EducationEntryForm from "./about/EducationEntryForm";
import EntryForm from "./about/EntryForm";
import ExperienceEntryForm from "./about/ExperienceEntryForm";
import HobbiesEditor from "./about/HobbiesEditor";
import LeadershipEditor from "./about/LeadershipEditor";
import SkillCategoryCard from "./about/SkillsEditor";
import type {
  AboutEditableShape,
  Certification,
  DynamicEntry,
  Education,
  Experience,
  FieldDef,
  Hobby,
  Leadership,
  Skill,
  SkillCategory,
  SkillProject,
} from "./about/types";

// Experience/Education entry form component

// Main component
interface AboutSettingsSectionProps {
  onError?: (message: string) => void;
}

export default function AboutSettingsSection({ onError }: AboutSettingsSectionProps) {
  const { showToast } = useToast();
  const [aboutData, setAboutData] = useState<AboutEditableShape>({
    professionalSummary: "",
    technicalSkills: [],
    professionalExperience: [],
    education: [],
    technicalCertifications: [],
    leadershipExperience: [],
    leadershipSubtitle: "",
    hobbies: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAboutData = useCallback(async () => {
    try {
      const res = await fetch("/api/about");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as Partial<AboutEditableShape>;
      setAboutData({
        professionalSummary: data.professionalSummary || "",
        technicalSkills: data.technicalSkills || [],
        professionalExperience: data.professionalExperience || [],
        education: data.education || [],
        technicalCertifications: data.technicalCertifications || [],
        leadershipExperience: data.leadershipExperience || [],
        leadershipSubtitle: data.leadershipSubtitle || "",
        hobbies: data.hobbies || [],
      });
    } catch (_error) {
      onError?.("Failed to load about page data");
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchAboutData();
  }, [fetchAboutData]);

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
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
    } catch (_error) {
      showToast("Failed to save settings", "error");
      onError?.("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof AboutEditableShape>(
    field: K,
    value: AboutEditableShape[K]
  ) => {
    setAboutData((prev) => ({ ...prev, [field]: value }));
  };

  // Field definitions for different entry types
  const certificationFields = [
    { key: "organization", label: "Organization", placeholder: "e.g., AWS" },
    { key: "name", label: "Certification Name", placeholder: "e.g., Solutions Architect" },
    { key: "issueDate", label: "Issue Date", type: "date" },
    { key: "expirationDate", label: "Expiration Date", type: "date" },
    { key: "credentialUrl", label: "Credential URL", type: "url", placeholder: "https://..." },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Professional Summary */}
      <CollapsibleSection title="Professional Summary" defaultOpen={true}>
        <MarkdownEditor
          label="Summary (Markdown)"
          value={aboutData.professionalSummary}
          onChange={(value) => updateField("professionalSummary", value)}
          placeholder="Write your professional summary here. Markdown is supported..."
          rows={10}
        />
      </CollapsibleSection>

      {/* Technical Skills - Nested by Category */}
      <ArraySection<SkillCategory>
        title="Skill Categories"
        items={aboutData.technicalSkills}
        onItemsChange={(items) => updateField("technicalSkills", items)}
        addNew={() => ({
          category: "",
          skills: [],
        })}
        renderItem={(category, index, onChange, onRemove) => (
          <SkillCategoryCard
            key={index}
            category={category}
            index={index}
            onChange={onChange}
            onRemove={onRemove}
          />
        )}
      />

      {/* Professional Experience */}
      <ArraySection<Experience>
        title="Professional Experience"
        items={aboutData.professionalExperience}
        onItemsChange={(items) => updateField("professionalExperience", items)}
        addNew={() => ({
          company: "",
          role: "",
          description: "",
          startDate: "",
          endDate: "",
          isOngoing: false,
          achievements: [],
        })}
        renderItem={(entry, index, onChange, onRemove) => (
          <ExperienceEntryForm
            key={index}
            entry={entry}
            index={index}
            onChange={onChange}
            onRemove={onRemove}
          />
        )}
      />

      {/* Education */}
      <ArraySection<Education>
        title="Education"
        items={aboutData.education}
        onItemsChange={(items) => updateField("education", items)}
        addNew={() => ({
          institution: "",
          degree: "",
          fieldOfStudy: "",
          startDate: "",
          endDate: "",
          isOngoing: false,
          expectedGradDate: "",
          relevantCoursework: [],
        })}
        renderItem={(entry, index, onChange, onRemove) => (
          <EducationEntryForm
            key={index}
            entry={entry}
            index={index}
            onChange={onChange}
            onRemove={onRemove}
          />
        )}
      />

      {/* Technical Certifications */}
      <ArraySection<Certification>
        title="Technical Certifications"
        items={aboutData.technicalCertifications}
        onItemsChange={(items) => updateField("technicalCertifications", items)}
        addNew={() => ({
          organization: "",
          name: "",
          issueDate: "",
          expirationDate: "",
          credentialUrl: "",
        })}
        renderItem={(entry, index, onChange, onRemove) => (
          <EntryForm
            key={index}
            entry={entry as DynamicEntry}
            index={index}
            onChange={(updated) => onChange(updated as Certification)}
            onRemove={onRemove}
            fields={certificationFields}
            entityName="Certification"
          />
        )}
      />

      {/* Leadership Experience */}
      <LeadershipEditor
        entries={aboutData.leadershipExperience}
        subtitle={aboutData.leadershipSubtitle}
        onEntriesChange={(entries) => updateField("leadershipExperience", entries)}
        onSubtitleChange={(subtitle) => updateField("leadershipSubtitle", subtitle)}
      />

      {/* Hobbies */}
      <HobbiesEditor
        hobbies={aboutData.hobbies}
        onChange={(hobbies) => updateField("hobbies", hobbies)}
      />

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
        <button type="submit" disabled={saving} className={adminStyles.buttonPrimary}>
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </form>
  );
}
