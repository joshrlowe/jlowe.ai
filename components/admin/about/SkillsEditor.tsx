import FormField from "../shared/FormField";
import { adminStyles } from "../shared/styles";
import type { Skill, SkillCategory, SkillProject } from "./types";

const expertiseLevels = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "Expert", label: "Expert" },
];

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

interface SkillCategoryCardProps {
  category: SkillCategory;
  onChange: (category: SkillCategory) => void;
  onRemove: () => void;
  index: number;
}

/**
 * Skill category card with nested skills and per-skill related projects.
 *
 * Preserves all data-testid values from the original inline implementation:
 * `skill-category-N`, `skill-item-N`, `add-skill-to-category-N`,
 * `remove-skill-N`, `project-N-M`, `add-project-N`, `remove-category-N`.
 */
export default function SkillCategoryCard({
  category,
  onChange,
  onRemove,
  index,
}: SkillCategoryCardProps) {
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
