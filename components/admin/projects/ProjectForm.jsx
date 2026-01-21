/**
 * ProjectForm - Project creation/editing form
 *
 * Refactoring: Extract Component from ProjectsSettingsSection
 */

import { useState, useRef } from "react";
import { FormField, TagInput, MediaUpload, adminStyles, PROJECT_STATUSES } from "../shared";
import TeamMemberManager from "../TeamMemberManager";

// Simple PDF upload component
function PaperUpload({ onUpload }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("pdf")) {
      alert("Please select a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const response = await fetch("/api/admin/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: reader.result,
              filename: file.name,
              type: file.type,
            }),
          });

          const data = await response.json();
          if (response.ok) {
            onUpload(data.url, file.name);
          } else {
            alert(data.error || "Upload failed");
          }
        } catch {
          alert("Upload failed");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      alert("Failed to read file");
      setUploading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={adminStyles.buttonSecondary}
      >
        {uploading ? "Uploading..." : "Upload PDF"}
      </button>
    </>
  );
}

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

      {/* Background Image */}
      <MediaUpload
        label="Background Image"
        value={formData.backgroundImage}
        onChange={(url) =>
          setFormData({ ...formData, backgroundImage: url })
        }
        accept="image/jpeg,image/png,image/gif,image/webp"
        type="image"
        placeholder="Fallback image when no thumbnail is available"
      />

      {/* Papers / PDFs */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-[var(--color-text-primary)]">
          Associated Papers (PDFs)
        </label>
        {(formData.papers || []).map((paper, index) => (
          <div key={index} className="flex gap-2 items-start p-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)]">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={paper.title || ""}
                onChange={(e) => {
                  const updated = [...(formData.papers || [])];
                  updated[index] = { ...updated[index], title: e.target.value };
                  setFormData({ ...formData, papers: updated });
                }}
                placeholder="Paper title"
                className={adminStyles.input}
              />
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={paper.url || ""}
                  onChange={(e) => {
                    const updated = [...(formData.papers || [])];
                    updated[index] = { ...updated[index], url: e.target.value };
                    setFormData({ ...formData, papers: updated });
                  }}
                  placeholder="PDF URL"
                  className={`flex-1 ${adminStyles.input}`}
                />
                {paper.url && (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-primary)] text-sm hover:underline"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const updated = (formData.papers || []).filter((_, i) => i !== index);
                setFormData({ ...formData, papers: updated });
              }}
              className="text-red-400 hover:text-red-300 p-1"
              title="Remove paper"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setFormData({
                ...formData,
                papers: [...(formData.papers || []), { title: "", url: "" }],
              });
            }}
            className={adminStyles.buttonSecondary}
          >
            + Add Paper Entry
          </button>
          <PaperUpload
            onUpload={(url, filename) => {
              setFormData({
                ...formData,
                papers: [...(formData.papers || []), { title: filename.replace(/\.pdf$/i, ""), url }],
              });
            }}
          />
        </div>
      </div>

      {/* Team Members */}
      <TeamMemberManager
        teamMembers={formData.teamMembers || []}
        onChange={(teamMembers) =>
          setFormData({ ...formData, teamMembers })
        }
      />

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
