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
import LeadershipEditor from "./about/LeadershipEditor";
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
// Expertise level options for skills
const expertiseLevels = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "Expert", label: "Expert" },
];

// Individual skill within a category
interface SkillItemProps {
  skill: Skill;
  onChange: (skill: Skill) => void;
  onRemove: () => void;
  skillIndex: number;
}

function SkillItem({ skill, onChange, onRemove, skillIndex }: SkillItemProps) {
  const handleFieldChange = <K extends keyof Skill>(field: K, value: Skill[K]) => {
    onChange({ ...skill, [field]: value });
  };

  const handleProjectChange = <K extends keyof SkillProject>(
    projectIndex: number,
    field: K,
    value: SkillProject[K]
  ) => {
    const newProjects = [...(skill.projects || [])];
    newProjects[projectIndex] = {
      ...newProjects[projectIndex],
      [field]: value,
    };
    handleFieldChange("projects", newProjects);
  };

  const addProject = () => {
    handleFieldChange("projects", [...(skill.projects || []), { name: "", repositoryLink: "" }]);
  };

  const removeProject = (projectIndex: number) => {
    handleFieldChange(
      "projects",
      (skill.projects || []).filter((_, i) => i !== projectIndex)
    );
  };

  return (
    <div
      className="p-3 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)]"
      data-testid={`skill-item-${skillIndex}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[var(--color-text-muted)]">
          Skill #{skillIndex + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
          data-testid={`remove-skill-${skillIndex}`}
        >
          Remove Skill
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField
          label="Skill Name"
          value={skill.name || ""}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          placeholder="e.g., React, Python, AWS"
          inputClassName="text-sm"
        />
        <FormField
          label="Expertise Level"
          value={skill.expertiseLevel || "Intermediate"}
          onChange={(e) => handleFieldChange("expertiseLevel", e.target.value)}
          options={expertiseLevels}
          inputClassName="text-sm"
        />
      </div>

      {/* Related Projects */}
      <div className="mt-3">
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
          Related Projects (Optional)
        </label>
        <div className="space-y-2">
          {(skill.projects || []).map((project, pIdx) => (
            <div key={pIdx} className="flex gap-2" data-testid={`project-${skillIndex}-${pIdx}`}>
              <input
                type="text"
                value={project.name || ""}
                onChange={(e) => handleProjectChange(pIdx, "name", e.target.value)}
                placeholder="Project name"
                className={`flex-1 text-sm ${adminStyles.inputSmall}`}
              />
              <input
                type="url"
                value={project.repositoryLink || ""}
                onChange={(e) => handleProjectChange(pIdx, "repositoryLink", e.target.value)}
                placeholder="URL (optional)"
                className={`flex-1 text-sm ${adminStyles.inputSmall}`}
              />
              <button
                type="button"
                onClick={() => removeProject(pIdx)}
                className="px-2 text-red-400 hover:text-red-300"
                aria-label="Remove project"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addProject}
            className="text-xs px-3 py-1 rounded border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            data-testid={`add-project-${skillIndex}`}
          >
            + Add Project
          </button>
        </div>
      </div>
    </div>
  );
}

// Skill Category entry component with nested skills
interface SkillCategoryEntryProps {
  category: SkillCategory;
  onChange: (category: SkillCategory) => void;
  onRemove: () => void;
  index: number;
}

function SkillCategoryEntry({ category, onChange, onRemove, index }: SkillCategoryEntryProps) {
  const handleCategoryNameChange = (name: string) => {
    onChange({ ...category, category: name });
  };

  const handleSkillChange = (skillIndex: number, updatedSkill: Skill) => {
    const newSkills = [...(category.skills || [])];
    newSkills[skillIndex] = updatedSkill;
    onChange({ ...category, skills: newSkills });
  };

  const addSkill = () => {
    onChange({
      ...category,
      skills: [
        ...(category.skills || []),
        { name: "", expertiseLevel: "Intermediate", projects: [] },
      ],
    });
  };

  const removeSkill = (skillIndex: number) => {
    onChange({
      ...category,
      skills: (category.skills || []).filter((_, i) => i !== skillIndex),
    });
  };

  const skillCount = (category.skills || []).length;

  return (
    <div className={adminStyles.card} data-testid={`skill-category-${index}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Category #{index + 1}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            {skillCount} skill{skillCount !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className={adminStyles.buttonDangerOutline}
          data-testid={`remove-category-${index}`}
        >
          Remove Category
        </button>
      </div>

      {/* Category Name */}
      <FormField
        label="Category Name"
        value={category.category || ""}
        onChange={(e) => handleCategoryNameChange(e.target.value)}
        placeholder="e.g., Frontend, Backend, DevOps, Languages"
        className="mb-4"
      />

      {/* Skills within this category */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className={adminStyles.label} style={{ marginBottom: 0 }}>
            Skills in this Category
          </label>
        </div>

        {(category.skills || []).length === 0 ? (
          <div className="text-sm text-[var(--color-text-muted)] italic p-4 rounded-lg bg-[var(--color-bg-darker)] border border-dashed border-[var(--color-border)]">
            No skills added yet. Click below to add your first skill.
          </div>
        ) : (
          <div className="space-y-3">
            {(category.skills || []).map((skill, sIdx) => (
              <SkillItem
                key={sIdx}
                skill={skill}
                skillIndex={sIdx}
                onChange={(updatedSkill) => handleSkillChange(sIdx, updatedSkill)}
                onRemove={() => removeSkill(sIdx)}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addSkill}
          className={`w-full py-2 text-sm ${adminStyles.buttonOutline}`}
          data-testid={`add-skill-to-category-${index}`}
        >
          + Add Skill to {category.category || "this Category"}
        </button>
      </div>
    </div>
  );
}

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
          <SkillCategoryEntry
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
      <CollapsibleSection
        title={`Hobbies & Interests (${aboutData.hobbies.length})`}
        defaultOpen={aboutData.hobbies.length > 0}
      >
        <div className="space-y-3">
          {aboutData.hobbies.map((hobby, index) => {
            // Handle both string and object formats
            const hobbyName = typeof hobby === "string" ? hobby : hobby.name || "";
            const hobbyColor = typeof hobby === "string" ? "" : hobby.color || "";

            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-darker)]"
              >
                <input
                  type="text"
                  value={hobbyName}
                  onChange={(e) => {
                    const newHobbies = [...aboutData.hobbies];
                    newHobbies[index] = { name: e.target.value, color: hobbyColor };
                    updateField("hobbies", newHobbies);
                  }}
                  placeholder="Hobby name"
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--color-text-muted)]">Color:</label>
                  <input
                    type="color"
                    value={hobbyColor || "#FAA307"}
                    onChange={(e) => {
                      const newHobbies = [...aboutData.hobbies];
                      newHobbies[index] = { name: hobbyName, color: e.target.value };
                      updateField("hobbies", newHobbies);
                    }}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      "hobbies",
                      aboutData.hobbies.filter((_, i) => i !== index)
                    )
                  }
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                >
                  ✕
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() =>
              updateField("hobbies", [...aboutData.hobbies, { name: "", color: "#FAA307" }])
            }
            className={`w-full py-2 ${adminStyles.buttonOutline}`}
          >
            + Add Hobby
          </button>
        </div>
      </CollapsibleSection>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
        <button type="submit" disabled={saving} className={adminStyles.buttonPrimary}>
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </form>
  );
}
