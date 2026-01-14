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

// Professional Experience entry component with Ongoing toggle
function ExperienceEntryForm({ entry, onChange, onRemove, index }) {
  const handleFieldChange = (field, value) => {
    onChange({ ...entry, [field]: value });
  };

  const handleOngoingToggle = (checked) => {
    const updates = { isOngoing: checked };
    // Clear end date when marking as ongoing
    if (checked) {
      updates.endDate = "";
    }
    onChange({ ...entry, ...updates });
  };

  const isOngoing = entry.isOngoing || false;

  return (
    <div className={adminStyles.card}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          Experience #{index + 1}
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
        <FormField
          label="Company"
          value={entry.company || ""}
          onChange={(e) => handleFieldChange("company", e.target.value)}
          placeholder="Company name"
        />
        <FormField
          label="Role/Title"
          value={entry.role || ""}
          onChange={(e) => handleFieldChange("role", e.target.value)}
          placeholder="Your role"
        />
        <div className="md:col-span-2">
          <MarkdownEditor
            label="Description (Markdown)"
            value={entry.description || ""}
            onChange={(value) => handleFieldChange("description", value)}
            rows={4}
            placeholder="Describe your responsibilities and accomplishments. Markdown is supported..."
          />
        </div>
        <FormField
          label="Start Date"
          type="date"
          value={entry.startDate || ""}
          onChange={(e) => handleFieldChange("startDate", e.target.value)}
        />
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={adminStyles.label} style={{ marginBottom: 0 }}>
              End Date
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOngoing}
                onChange={(e) => handleOngoingToggle(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-darker)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-0 cursor-pointer"
                data-testid="ongoing-checkbox"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">
                Ongoing
              </span>
            </label>
          </div>
          {isOngoing ? (
            <div
              className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-muted)] italic"
              data-testid="ongoing-indicator"
            >
              Present
            </div>
          ) : (
            <input
              type="date"
              value={entry.endDate || ""}
              onChange={(e) => handleFieldChange("endDate", e.target.value)}
              className={adminStyles.input}
              required={!isOngoing}
              data-testid="end-date-input"
            />
          )}
        </div>
        <div className="md:col-span-2">
          <TagInput
            label="Achievements"
            tags={entry.achievements || []}
            onAdd={(tag) =>
              handleFieldChange("achievements", [
                ...(entry.achievements || []),
                tag,
              ])
            }
            onRemove={(idx) =>
              handleFieldChange(
                "achievements",
                (entry.achievements || []).filter((_, i) => i !== idx),
              )
            }
            placeholder="Add achievement"
          />
        </div>
      </div>
    </div>
  );
}

// Education entry component with Ongoing toggle and Expected Graduation Date
function EducationEntryForm({ entry, onChange, onRemove, index }) {
  const handleFieldChange = (field, value) => {
    onChange({ ...entry, [field]: value });
  };

  const handleOngoingToggle = (checked) => {
    const updates = { isOngoing: checked };
    // Clear end date when marking as ongoing, keep expectedGradDate
    if (checked) {
      updates.endDate = "";
    } else {
      // Clear expected graduation date when not ongoing
      updates.expectedGradDate = "";
    }
    onChange({ ...entry, ...updates });
  };

  const isOngoing = entry.isOngoing || false;

  return (
    <div className={adminStyles.card} data-testid={`education-entry-${index}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          Education #{index + 1}
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
        <FormField
          label="Institution"
          value={entry.institution || ""}
          onChange={(e) => handleFieldChange("institution", e.target.value)}
          placeholder="University or school name"
        />
        <FormField
          label="Degree"
          value={entry.degree || ""}
          onChange={(e) => handleFieldChange("degree", e.target.value)}
          placeholder="e.g., Bachelor of Science"
        />
        <FormField
          label="Field of Study"
          value={entry.fieldOfStudy || ""}
          onChange={(e) => handleFieldChange("fieldOfStudy", e.target.value)}
          placeholder="e.g., Computer Science"
        />
        <FormField
          label="Start Date"
          type="date"
          value={entry.startDate || ""}
          onChange={(e) => handleFieldChange("startDate", e.target.value)}
        />

        {/* End Date / Expected Graduation with Ongoing Toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={adminStyles.label} style={{ marginBottom: 0 }}>
              {isOngoing ? "Expected Graduation" : "End Date"}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOngoing}
                onChange={(e) => handleOngoingToggle(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-darker)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-0 cursor-pointer"
                data-testid={`education-ongoing-checkbox-${index}`}
              />
              <span className="text-sm text-[var(--color-text-secondary)]">
                Currently Enrolled
              </span>
            </label>
          </div>
          {isOngoing ? (
            <input
              type="date"
              value={entry.expectedGradDate || ""}
              onChange={(e) => handleFieldChange("expectedGradDate", e.target.value)}
              className={adminStyles.input}
              placeholder="Expected graduation date"
              data-testid={`education-expected-grad-${index}`}
            />
          ) : (
            <input
              type="date"
              value={entry.endDate || ""}
              onChange={(e) => handleFieldChange("endDate", e.target.value)}
              className={adminStyles.input}
              required={!isOngoing}
              data-testid={`education-end-date-${index}`}
            />
          )}
          {isOngoing && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Leave empty if graduation date is unknown
            </p>
          )}
        </div>

        {/* Relevant Coursework */}
        <div className="md:col-span-2">
          <TagInput
            label="Relevant Coursework"
            tags={entry.relevantCoursework || []}
            onAdd={(course) =>
              handleFieldChange("relevantCoursework", [
                ...(entry.relevantCoursework || []),
                course,
              ])
            }
            onRemove={(idx) =>
              handleFieldChange(
                "relevantCoursework",
                (entry.relevantCoursework || []).filter((_, i) => i !== idx),
              )
            }
            placeholder="Add course name"
          />
        </div>
      </div>
    </div>
  );
}

// Expertise level options for skills
const expertiseLevels = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "Expert", label: "Expert" },
];

// Individual skill within a category
function SkillItem({ skill, onChange, onRemove, skillIndex }) {
  const handleFieldChange = (field, value) => {
    onChange({ ...skill, [field]: value });
  };

  const handleProjectChange = (projectIndex, field, value) => {
    const newProjects = [...(skill.projects || [])];
    newProjects[projectIndex] = {
      ...newProjects[projectIndex],
      [field]: value,
    };
    handleFieldChange("projects", newProjects);
  };

  const addProject = () => {
    handleFieldChange("projects", [
      ...(skill.projects || []),
      { name: "", repositoryLink: "" },
    ]);
  };

  const removeProject = (projectIndex) => {
    handleFieldChange(
      "projects",
      (skill.projects || []).filter((_, i) => i !== projectIndex),
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
function SkillCategoryEntry({ category, onChange, onRemove, index }) {
  const handleCategoryNameChange = (name) => {
    onChange({ ...category, category: name });
  };

  const handleSkillChange = (skillIndex, updatedSkill) => {
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

  const removeSkill = (skillIndex) => {
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

      {/* Technical Skills - Nested by Category */}
      <ArraySection
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
