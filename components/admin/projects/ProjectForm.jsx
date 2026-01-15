/**
 * ProjectForm - Project creation/editing form
 *
 * Refactoring: Extract Component from ProjectsSettingsSection
 */

import { useState } from "react";
import { FormField, TagInput, adminStyles, PROJECT_STATUSES } from "../shared";

export default function ProjectForm({
  formData,
  setFormData,
  saving,
  onSave,
  onCancel,
  isEditing = false,
}) {
  const [_newTag, _setNewTag] = useState("");
  const [_newTech, _setNewTech] = useState("");

  const handleAddTag = (tag) => {
    if (!formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const handleRemoveTag = (index) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const handleAddTech = (tech) => {
    if (!formData.techStack.includes(tech)) {
      setFormData({ ...formData, techStack: [...formData.techStack, tech] });
    }
  };

  const handleRemoveTech = (index) => {
    setFormData({
      ...formData,
      techStack: formData.techStack.filter((_, i) => i !== index),
    });
  };

  return (
    <form onSubmit={onSave} className="space-y-4">
      {/* Title and Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <FormField
          label="Slug"
          value={formData.slug}
          onChange={(e) =>
            setFormData({
              ...formData,
              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
            })
          }
          required
        />
      </div>

      {/* Status */}
      <FormField
        label="Status"
        value={formData.status}
        onChange={(e) => {
          const newStatus = e.target.value;
          // Clear release date if switching to In Progress
          if (newStatus === "InProgress") {
            setFormData({ ...formData, status: newStatus, releaseDate: "" });
          } else {
            setFormData({ ...formData, status: newStatus });
          }
        }}
        options={PROJECT_STATUSES}
      />

      {/* Dates */}
      <div className={`grid gap-4 ${formData.status === "InProgress" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
        <FormField
          label="Start Date"
          type="date"
          value={formData.startDate}
          onChange={(e) =>
            setFormData({ ...formData, startDate: e.target.value })
          }
        />
        {formData.status !== "InProgress" && (
          <FormField
            label="Release Date"
            type="date"
            value={formData.releaseDate}
            onChange={(e) =>
              setFormData({ ...formData, releaseDate: e.target.value })
            }
          />
        )}
      </div>

      {/* Descriptions */}
      <FormField
        label="Short Description"
        value={formData.shortDescription}
        onChange={(e) =>
          setFormData({ ...formData, shortDescription: e.target.value })
        }
        rows={2}
      />

      <FormField
        label="Description"
        value={formData.longDescription}
        onChange={(e) =>
          setFormData({ ...formData, longDescription: e.target.value })
        }
        rows={4}
      />

      {/* Tags */}
      <TagInput
        label="Tags"
        tags={formData.tags}
        onAdd={handleAddTag}
        onRemove={handleRemoveTag}
        placeholder="Add tag"
      />

      {/* Tech Stack */}
      <TagInput
        label="Tech Stack"
        tags={formData.techStack}
        onAdd={handleAddTech}
        onRemove={handleRemoveTech}
        placeholder="Add technology"
      />

      {/* Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="GitHub URL"
          type="url"
          value={formData.links.github}
          onChange={(e) =>
            setFormData({
              ...formData,
              links: { ...formData.links, github: e.target.value },
            })
          }
        />
        <FormField
          label="Live URL"
          type="url"
          value={formData.links.live}
          onChange={(e) =>
            setFormData({
              ...formData,
              links: { ...formData.links, live: e.target.value },
            })
          }
        />
      </div>

      {/* Featured checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="featured"
          checked={formData.featured}
          onChange={(e) =>
            setFormData({ ...formData, featured: e.target.checked })
          }
          className="rounded"
        />
        <label
          htmlFor="featured"
          className="text-sm text-[var(--color-text-primary)]"
        >
          Featured Project
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={onCancel}
          className={adminStyles.buttonSecondary}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className={adminStyles.buttonPrimary}
        >
          {saving ? "Saving..." : isEditing ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
