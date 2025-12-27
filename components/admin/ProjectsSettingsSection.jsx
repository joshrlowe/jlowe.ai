/**
 * ProjectsSettingsSection - Admin UI for managing projects
 *
 * Refactoring Applied:
 * - Extract Component: ProjectForm, ProjectListItem
 * - Extract Constants: PROJECT_STATUSES → shared/constants
 * - Replace Modal inline with shared Modal component
 *
 * Reduced from 505 lines to ~180 lines (~65% reduction)
 */

import { useState, useEffect, useMemo } from "react";
import { useToast } from "./ToastProvider";
import { LoadingSpinner, Modal, adminStyles, PROJECT_STATUSES } from "./shared";
import { ProjectForm, ProjectListItem } from "./projects";

const INITIAL_FORM_DATA = {
  title: "",
  slug: "",
  shortDescription: "",
  longDescription: "",
  tags: [],
  techStack: [],
  links: { github: "", live: "" },
  images: [],
  featured: false,
  status: "Draft",
  startDate: "",
  releaseDate: "",
};

export default function ProjectsSettingsSection({ onError }) {
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.shortDescription?.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    return filtered.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );
  }, [projects, searchQuery, statusFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/projects");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      showToast("Failed to load projects", "error");
      onError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const parseJsonField = (field, defaultValue = null) => {
    if (!field) return defaultValue;
    if (typeof field === "string") {
      try {
        return JSON.parse(field);
      } catch {
        return defaultValue;
      }
    }
    return field;
  };

  const handleCreate = () => {
    setEditingProject(null);
    setFormData({
      ...INITIAL_FORM_DATA,
      startDate: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const handleEdit = async (project) => {
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`);
      if (res.ok) {
        const fullProject = await res.json();
        setEditingProject(fullProject);

        const techStack = parseJsonField(fullProject.techStack, []);
        const tags = parseJsonField(fullProject.tags, []);
        let links = parseJsonField(fullProject.links, { github: "", live: "" });

        setFormData({
          title: fullProject.title || "",
          slug: fullProject.slug || "",
          shortDescription: fullProject.shortDescription || "",
          longDescription: fullProject.longDescription || "",
          tags: Array.isArray(tags) ? tags : [],
          techStack: Array.isArray(techStack) ? techStack : [],
          links:
            typeof links === "object" && links !== null
              ? { github: links.github || "", live: links.live || "" }
              : { github: "", live: "" },
          images: parseJsonField(fullProject.images, []),
          featured: fullProject.featured || false,
          status: fullProject.status || "Draft",
          startDate: fullProject.startDate
            ? new Date(fullProject.startDate).toISOString().split("T")[0]
            : "",
          releaseDate: fullProject.releaseDate
            ? new Date(fullProject.releaseDate).toISOString().split("T")[0]
            : "",
        });
        setShowModal(true);
      }
    } catch (error) {
      showToast("Failed to load project details", "error");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      showToast("Title and slug are required", "error");
      return;
    }

    setSaving(true);
    try {
      const url = editingProject
        ? `/api/admin/projects/${editingProject.id}`
        : "/api/admin/projects";
      const method = editingProject ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save");
      }

      showToast(
        editingProject ? "Project updated!" : "Project created!",
        "success",
      );
      setShowModal(false);
      fetchProjects();
    } catch (error) {
      showToast(error.message || "Failed to save project", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      showToast("Project deleted", "success");
      fetchProjects();
    } catch (error) {
      showToast("Failed to delete project", "error");
    }
  };

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast("Status updated", "success");
        fetchProjects();
      }
    } catch (error) {
      showToast("Failed to update status", "error");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`flex-1 min-w-[200px] ${adminStyles.inputSmall}`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={adminStyles.inputSmall}
        >
          <option value="all">All Statuses</option>
          {PROJECT_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <button onClick={handleCreate} className={adminStyles.buttonPrimary}>
          Create Project
        </button>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-muted)]">
          <p>No projects found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProject ? "Edit Project" : "Create Project"}
        maxWidth="max-w-6xl"
      >
        <ProjectForm
          formData={formData}
          setFormData={setFormData}
          saving={saving}
          onSave={handleSave}
          onCancel={() => setShowModal(false)}
          isEditing={!!editingProject}
        />
      </Modal>
    </div>
  );
}
