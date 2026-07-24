/**
 * AboutSettingsSection — admin editor shell for the About page.
 *
 * Composes the editor primitives in components/admin/about/* and the
 * load/save loop in lib/hooks/useAboutForm. Itself only owns the form
 * tag, the loading spinner, and the wiring between fields and child
 * components — no fetch, no persistence, no field-shape knowledge.
 */

import type { FormEvent } from "react";
import { useToast } from "./ToastProvider";
import MarkdownEditor from "./MarkdownEditor";
import ArraySection from "./shared/ArraySection";
import CollapsibleSection from "./shared/CollapsibleSection";
import { adminStyles } from "./shared/styles";
import EducationEntryForm from "./about/EducationEntryForm";
import EntryForm from "./about/EntryForm";
import ExperienceEntryForm from "./about/ExperienceEntryForm";
import HobbiesEditor from "./about/HobbiesEditor";
import LeadershipEditor from "./about/LeadershipEditor";
import SkillCategoryCard from "./about/SkillsEditor";
import { useAboutForm } from "@/lib/hooks/useAboutForm";
import type {
  Certification,
  DynamicEntry,
  Education,
  Experience,
  FieldDef,
  SkillCategory,
} from "./about/types";

interface AboutSettingsSectionProps {
  onError?: (message: string) => void;
}

const certificationFields: FieldDef[] = [
  { key: "organization", label: "Organization", placeholder: "e.g., AWS" },
  { key: "name", label: "Certification Name", placeholder: "e.g., Solutions Architect" },
  { key: "issueDate", label: "Issue Date", type: "date" },
  { key: "expirationDate", label: "Expiration Date", type: "date" },
  { key: "credentialUrl", label: "Credential URL", type: "url", placeholder: "https://..." },
];

export default function AboutSettingsSection({ onError }: AboutSettingsSectionProps) {
  const { showToast } = useToast();
  const { data, loading, saving, updateField, save } = useAboutForm({ onError });

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = await save();
    showToast(
      ok ? "About page settings saved!" : "Failed to save settings",
      ok ? "success" : "error"
    );
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
      {/* Professional Summary */}
      <CollapsibleSection title="Professional Summary" defaultOpen={true}>
        <MarkdownEditor
          label="Summary (Markdown)"
          value={data.professionalSummary}
          onChange={(value) => updateField("professionalSummary", value)}
          placeholder="Write your professional summary here. Markdown is supported..."
          rows={10}
        />
      </CollapsibleSection>

      {/* Technical Skills - Nested by Category */}
      <ArraySection<SkillCategory>
        title="Skill Categories"
        items={data.technicalSkills}
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
        items={data.professionalExperience}
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
        items={data.education}
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
        items={data.technicalCertifications}
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
        entries={data.leadershipExperience}
        subtitle={data.leadershipSubtitle}
        onEntriesChange={(entries) => updateField("leadershipExperience", entries)}
        onSubtitleChange={(subtitle) => updateField("leadershipSubtitle", subtitle)}
      />

      {/* Hobbies */}
      <HobbiesEditor
        hobbies={data.hobbies}
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
