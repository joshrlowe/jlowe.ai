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

import { useState, useEffect, useCallback } from "react";
import { useToast } from "./ToastProvider";
import MarkdownEditor from "./MarkdownEditor";
import FormField from "./shared/FormField";
import TagInput from "./shared/TagInput";
import { adminStyles } from "./shared/styles";

// Collapsible section component
function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-[var(--color-bg-darker)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
      >
        <span className="font-medium text-[var(--color-text-primary)]">
          {title}
        </span>
        <span
          className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

// Experience/Education entry form component
function EntryForm({
  entry,
  onChange,
  onRemove,
  fields,
  index,
  entityName = "Entry",
}) {
  const handleFieldChange = (field, value) => {
    onChange({ ...entry, [field]: value });
  };

  return (
    <div className={adminStyles.card}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          {entityName} #{index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className={adminStyles.buttonDangerOutline}
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          if (field.type === "achievements" || field.type === "tags") {
            return (
              <div key={field.key} className="md:col-span-2">
                <TagInput
                  label={field.label}
                  tags={entry[field.key] || []}
                  onAdd={(tag) =>
                    handleFieldChange(field.key, [
                      ...(entry[field.key] || []),
                      tag,
                    ])
                  }
                  onRemove={(idx) =>
                    handleFieldChange(
                      field.key,
                      (entry[field.key] || []).filter((_, i) => i !== idx),
                    )
                  }
                  placeholder={field.placeholder || "Add item"}
                />
              </div>
            );
          }
          if (field.type === "textarea") {
            return (
              <div key={field.key} className="md:col-span-2">
                <FormField
                  label={field.label}
                  value={entry[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  rows={3}
                  placeholder={field.placeholder}
                />
              </div>
            );
          }
          return (
            <FormField
              key={field.key}
              label={field.label}
              type={field.type || "text"}
              value={entry[field.key] || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          );
        })}
      </div>
    </div>
  );
}

// Technical Skill entry component
function SkillEntry({ skill, onChange, onRemove, index }) {
  const handleFieldChange = (field, value) => {
    onChange({ ...skill, [field]: value });
  };

  const expertiseLevels = [
    { value: "Beginner", label: "Beginner" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Advanced", label: "Advanced" },
    { value: "Expert", label: "Expert" },
  ];

  return (
    <div className={adminStyles.card}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          Skill #{index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className={adminStyles.buttonDangerOutline}
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Category"
          value={skill.category || ""}
          onChange={(e) => handleFieldChange("category", e.target.value)}
          placeholder="e.g., Programming Languages"
        />
        <FormField
          label="Skill Name"
          value={skill.skillName || ""}
          onChange={(e) => handleFieldChange("skillName", e.target.value)}
          placeholder="e.g., Python"
        />
        <FormField
          label="Expertise Level"
          value={skill.expertiseLevel || "Intermediate"}
          onChange={(e) => handleFieldChange("expertiseLevel", e.target.value)}
          options={expertiseLevels}
        />
      </div>
      <div className="mt-4">
        <label className={adminStyles.label}>Related Projects</label>
        <div className="space-y-2">
          {(skill.projects || []).map((project, pIdx) => (
            <div key={pIdx} className="flex gap-2">
              <input
                type="text"
                value={project.name || ""}
                onChange={(e) => {
                  const newProjects = [...(skill.projects || [])];
                  newProjects[pIdx] = {
                    ...newProjects[pIdx],
                    name: e.target.value,
                  };
                  handleFieldChange("projects", newProjects);
                }}
                placeholder="Project name"
                className={`flex-1 ${adminStyles.inputSmall}`}
              />
              <input
                type="url"
                value={project.repositoryLink || ""}
                onChange={(e) => {
                  const newProjects = [...(skill.projects || [])];
                  newProjects[pIdx] = {
                    ...newProjects[pIdx],
                    repositoryLink: e.target.value,
                  };
                  handleFieldChange("projects", newProjects);
                }}
                placeholder="Repository URL"
                className={`flex-1 ${adminStyles.inputSmall}`}
              />
              <button
                type="button"
                onClick={() => {
                  handleFieldChange(
                    "projects",
                    (skill.projects || []).filter((_, i) => i !== pIdx),
                  );
                }}
                className="px-2 text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              handleFieldChange("projects", [
                ...(skill.projects || []),
                { name: "", repositoryLink: "" },
              ]);
            }}
            className={`text-sm ${adminStyles.buttonOutline}`}
          >
            + Add Project
          </button>
        </div>
      </div>
    </div>
  );
}

// Array section with add/remove functionality
function ArraySection({ title, items, onItemsChange, renderItem, addNew }) {
  const handleAdd = () => {
    onItemsChange([...items, addNew()]);
  };

  const handleRemove = (index) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleChange = (index, newItem) => {
    const newItems = [...items];
    newItems[index] = newItem;
    onItemsChange(newItems);
  };

  return (
    <CollapsibleSection
      title={`${title} (${items.length})`}
      defaultOpen={items.length > 0}
    >
      <div className="space-y-4">
        {items.map((item, index) =>
          renderItem(item, index, (newItem) => handleChange(index, newItem), () =>
            handleRemove(index),
          ),
        )}
        <button
          type="button"
          onClick={handleAdd}
          className={`w-full py-2 ${adminStyles.buttonOutline}`}
        >
          + Add {title.replace(/s$/, "")}
        </button>
      </div>
    </CollapsibleSection>
  );
}

// Main component
export default function AboutSettingsSection({ onError }) {
  const { showToast } = useToast();
  const [aboutData, setAboutData] = useState({
    professionalSummary: "",
    technicalSkills: [],
    professionalExperience: [],
    education: [],
    technicalCertifications: [],
    leadershipExperience: [],
    hobbies: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAboutData = useCallback(async () => {
    try {
      const res = await fetch("/api/about");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAboutData({
        professionalSummary: data.professionalSummary || "",
        technicalSkills: data.technicalSkills || [],
        professionalExperience: data.professionalExperience || [],
        education: data.education || [],
        technicalCertifications: data.technicalCertifications || [],
        leadershipExperience: data.leadershipExperience || [],
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

  const handleSave = async (e) => {
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

  const updateField = (field, value) => {
    setAboutData((prev) => ({ ...prev, [field]: value }));
  };

  // Field definitions for different entry types
  const experienceFields = [
    { key: "company", label: "Company", placeholder: "Company name" },
    { key: "role", label: "Role/Title", placeholder: "Your role" },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Describe your responsibilities...",
    },
    { key: "startDate", label: "Start Date", type: "date" },
    {
      key: "endDate",
      label: "End Date",
      type: "date",
      placeholder: "Leave empty if current",
    },
    {
      key: "achievements",
      label: "Achievements",
      type: "achievements",
      placeholder: "Add achievement",
    },
  ];

  const educationFields = [
    { key: "institution", label: "Institution", placeholder: "University name" },
    { key: "degree", label: "Degree", placeholder: "e.g., Bachelor of Science" },
    { key: "fieldOfStudy", label: "Field of Study", placeholder: "e.g., Computer Science" },
    { key: "startDate", label: "Start Date", type: "date" },
    { key: "endDate", label: "End Date", type: "date" },
    {
      key: "relevantCoursework",
      label: "Relevant Coursework",
      type: "tags",
      placeholder: "Add course",
    },
  ];

  const certificationFields = [
    { key: "organization", label: "Organization", placeholder: "e.g., AWS" },
    { key: "name", label: "Certification Name", placeholder: "e.g., Solutions Architect" },
    { key: "issueDate", label: "Issue Date", type: "date" },
    { key: "expirationDate", label: "Expiration Date", type: "date" },
    { key: "credentialUrl", label: "Credential URL", type: "url", placeholder: "https://..." },
  ];

  const leadershipFields = [
    { key: "organization", label: "Organization", placeholder: "Organization name" },
    { key: "role", label: "Role", placeholder: "Your role" },
    { key: "startDate", label: "Start Date", type: "date" },
    { key: "endDate", label: "End Date", type: "date" },
    {
      key: "achievements",
      label: "Achievements",
      type: "achievements",
      placeholder: "Add achievement",
    },
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

      {/* Technical Skills */}
      <ArraySection
        title="Technical Skills"
        items={aboutData.technicalSkills}
        onItemsChange={(items) => updateField("technicalSkills", items)}
        addNew={() => ({
          category: "",
          skillName: "",
          expertiseLevel: "Intermediate",
          projects: [],
        })}
        renderItem={(skill, index, onChange, onRemove) => (
          <SkillEntry
            key={index}
            skill={skill}
            index={index}
            onChange={onChange}
            onRemove={onRemove}
          />
        )}
      />

      {/* Professional Experience */}
      <ArraySection
        title="Professional Experience"
        items={aboutData.professionalExperience}
        onItemsChange={(items) => updateField("professionalExperience", items)}
        addNew={() => ({
          company: "",
          role: "",
          description: "",
          startDate: "",
          endDate: "",
          achievements: [],
        })}
        renderItem={(entry, index, onChange, onRemove) => (
          <EntryForm
            key={index}
            entry={entry}
            index={index}
            onChange={onChange}
            onRemove={onRemove}
            fields={experienceFields}
            entityName="Experience"
          />
        )}
      />

      {/* Education */}
      <ArraySection
        title="Education"
        items={aboutData.education}
        onItemsChange={(items) => updateField("education", items)}
        addNew={() => ({
          institution: "",
          degree: "",
          fieldOfStudy: "",
          startDate: "",
          endDate: "",
          relevantCoursework: [],
        })}
        renderItem={(entry, index, onChange, onRemove) => (
          <EntryForm
            key={index}
            entry={entry}
            index={index}
            onChange={onChange}
            onRemove={onRemove}
            fields={educationFields}
            entityName="Education"
          />
        )}
      />

      {/* Technical Certifications */}
      <ArraySection
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
            entry={entry}
            index={index}
            onChange={onChange}
            onRemove={onRemove}
            fields={certificationFields}
            entityName="Certification"
          />
        )}
      />

      {/* Leadership Experience */}
      <ArraySection
        title="Leadership Experience"
        items={aboutData.leadershipExperience}
        onItemsChange={(items) => updateField("leadershipExperience", items)}
        addNew={() => ({
          organization: "",
          role: "",
          startDate: "",
          endDate: "",
          achievements: [],
        })}
        renderItem={(entry, index, onChange, onRemove) => (
          <EntryForm
            key={index}
            entry={entry}
            index={index}
            onChange={onChange}
            onRemove={onRemove}
            fields={leadershipFields}
            entityName="Leadership"
          />
        )}
      />

      {/* Hobbies */}
      <CollapsibleSection
        title={`Hobbies & Interests (${aboutData.hobbies.length})`}
        defaultOpen={aboutData.hobbies.length > 0}
      >
        <TagInput
          label="Hobbies"
          tags={aboutData.hobbies}
          onAdd={(hobby) =>
            updateField("hobbies", [...aboutData.hobbies, hobby])
          }
          onRemove={(index) =>
            updateField(
              "hobbies",
              aboutData.hobbies.filter((_, i) => i !== index),
            )
          }
          placeholder="Add hobby or interest"
        />
      </CollapsibleSection>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
        <button
          type="submit"
          disabled={saving}
          className={adminStyles.buttonPrimary}
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </form>
  );
}
