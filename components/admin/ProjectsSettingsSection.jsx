import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button, Form, Table, Modal, Badge, InputGroup, Pagination, Alert } from "react-bootstrap";
import { useToast } from "./ToastProvider";
import { TableRowSkeleton } from "./SkeletonLoader";
import MarkdownEditor from "./MarkdownEditor";
import ProjectPreview from "./ProjectPreview";
import ImageUploader from "./ImageUploader";
import TeamMemberManager from "./TeamMemberManager";
import DateRangePicker from "./DateRangePicker";
import BulkActionsToolbar from "./BulkActionsToolbar";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";
import { useFormValidation } from "./useFormValidation";
import { useAutosave } from "./useAutosave";

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ProjectsSettingsSection({ onError }) {
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [autosaveStatus, setAutosaveStatus] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [dateRangeStart, setDateRangeStart] = useState(null);
  const [dateRangeEnd, setDateRangeEnd] = useState(null);
  const [updateBanner, setUpdateBanner] = useState(null);
  
  const [formData, setFormData] = useState({
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
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
    teamMembers: [],
  });
  
  const [newTag, setNewTag] = useState("");
  const [newTech, setNewTech] = useState("");

  const validationRules = {
    title: {
      required: "Title is required",
      minLength: 3,
      minLengthMessage: "Title must be at least 3 characters",
      maxLength: 200,
    },
    slug: {
      required: "Slug is required",
      pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      patternMessage: "Slug must be lowercase with hyphens only (e.g., my-project)",
      validate: (value) => {
        if (editingProject && value === editingProject.slug) return null;
        return null;
      },
    },
    links: {
      validate: (value, allValues) => {
        if (value.github && !/^https?:\/\/.+\..+/.test(value.github)) {
          return "GitHub URL must be a valid URL";
        }
        if (value.live && !/^https?:\/\/.+\..+/.test(value.live)) {
          return "Live site URL must be a valid URL";
        }
        return null;
      },
    },
  };

  const {
    errors,
    touched,
    validateField,
    validateAll,
    setFieldTouched,
    getFieldError,
  } = useFormValidation(validationRules);

  // Autosave functionality
  useAutosave(
    formData,
    async (data) => {
      if (!editingProject || !data.title) return;
      try {
        await fetch(`/api/admin/projects/${editingProject.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        setAutosaveStatus("saved");
        setTimeout(() => setAutosaveStatus(null), 2000);
      } catch (error) {
        setAutosaveStatus("error");
      }
    },
    30000
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlKey && e.key === "k") {
        e.preventDefault();
        document.querySelector('input[placeholder*="Search"]')?.focus();
      } else if (ctrlKey && e.key === "n" && !showModal) {
        e.preventDefault();
        handleCreate();
      } else if (ctrlKey && e.key === "s" && showModal) {
        e.preventDefault();
        document.querySelector('form[onsubmit]')?.requestSubmit();
      } else if (e.key === "Escape" && (showModal || showPreview || showShortcuts)) {
        setShowModal(false);
        setShowPreview(false);
        setShowShortcuts(false);
      } else if (ctrlKey && e.key === "/") {
        e.preventDefault();
        setShowShortcuts(true);
      } else if (ctrlKey && e.key === "a" && !showModal) {
        e.preventDefault();
        handleSelectAll();
      } else if (ctrlKey && e.key === "d" && !showModal) {
        e.preventDefault();
        handleDeselectAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal, showPreview, showShortcuts]);

  useEffect(() => {
    fetchProjects();
  }, []);

  // Filter and sort projects
  useEffect(() => {
    let filtered = [...projects];

    // Search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.shortDescription?.toLowerCase().includes(query) ||
          p.longDescription?.toLowerCase().includes(query) ||
          (Array.isArray(p.tags) && p.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Date range filter
    if (dateRangeStart) {
      filtered = filtered.filter((p) => {
        const startDate = p.startDate ? new Date(p.startDate) : null;
        return startDate && startDate >= new Date(dateRangeStart);
      });
    }
    if (dateRangeEnd) {
      filtered = filtered.filter((p) => {
        const startDate = p.startDate ? new Date(p.startDate) : null;
        return startDate && startDate <= new Date(dateRangeEnd + "T23:59:59");
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === "startDate" || sortBy === "releaseDate" || sortBy === "updatedAt" || sortBy === "createdAt") {
        aVal = aVal ? new Date(aVal) : new Date(0);
        bVal = bVal ? new Date(bVal) : new Date(0);
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal || "").toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [projects, debouncedSearchQuery, statusFilter, sortBy, sortOrder, dateRangeStart, dateRangeEnd]);

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

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [filteredProjects, currentPage, itemsPerPage]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: projects.length,
      published: projects.filter((p) => p.status === "Published").length,
      drafts: projects.filter((p) => p.status === "Draft").length,
      filtered: filteredProjects.length,
    };
  }, [projects, filteredProjects]);

  const showBanner = useCallback((message, type = "success") => {
    setUpdateBanner({ message, type });
    setTimeout(() => setUpdateBanner(null), 5000);
  }, []);

  const handleCreate = () => {
    setEditingProject(null);
    setFormData({
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
      startDate: new Date().toISOString().split("T")[0],
      releaseDate: "",
      metaTitle: "",
      metaDescription: "",
      ogImage: "",
      teamMembers: [],
    });
    setShowModal(true);
  };

  const handleDuplicate = async (project) => {
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`);
      if (res.ok) {
        const fullProject = await res.json();
        setEditingProject(null);
        
        const techStack = parseJsonField(fullProject.techStack, []);
        const tags = parseJsonField(fullProject.tags, []);
        const images = parseJsonField(fullProject.images, []);
        let links = parseJsonField(fullProject.links, { github: "", live: "" });
        const teamMembers = fullProject.teamMembers || [];

        setFormData({
          title: `${fullProject.title} (Copy)`,
          slug: `${fullProject.slug || ""}-copy-${Date.now()}`,
          shortDescription: fullProject.shortDescription || fullProject.description || "",
          longDescription: fullProject.longDescription || "",
          tags: Array.isArray(tags) ? tags : [],
          techStack: Array.isArray(techStack) ? techStack : [],
          links: typeof links === "object" && links !== null ? { github: links.github || "", live: links.live || "" } : { github: "", live: "" },
          images: Array.isArray(images) ? images : [],
          featured: false,
          status: "Draft",
          startDate: fullProject.startDate ? new Date(fullProject.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          releaseDate: fullProject.releaseDate ? new Date(fullProject.releaseDate).toISOString().split("T")[0] : "",
          metaTitle: fullProject.metaTitle || "",
          metaDescription: fullProject.metaDescription || "",
          ogImage: fullProject.ogImage || "",
          teamMembers: teamMembers.map(m => ({ name: m.name, email: m.email || null })),
        });
        setShowModal(true);
      }
    } catch (error) {
      showToast("Failed to duplicate project", "error");
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

  const handleEdit = async (project) => {
    try {
      const res = await fetch(`/api/admin/projects/${project.id}`);
      if (res.ok) {
        const fullProject = await res.json();
        setEditingProject(fullProject);

        const techStack = parseJsonField(fullProject.techStack, []);
        const tags = parseJsonField(fullProject.tags, []);
        const images = parseJsonField(fullProject.images, []);
        let links = parseJsonField(fullProject.links, { github: "", live: "" });
        const teamMembers = fullProject.teamMembers || [];

        if (!links.github && fullProject.repositoryLink) {
          links = { ...links, github: fullProject.repositoryLink };
        }

        setFormData({
          title: fullProject.title || "",
          slug: fullProject.slug || "",
          shortDescription: fullProject.shortDescription || fullProject.description || "",
          longDescription: fullProject.longDescription || "",
          tags: Array.isArray(tags) ? tags : [],
          techStack: Array.isArray(techStack) ? techStack : [],
          links: typeof links === "object" && links !== null ? { github: links.github || "", live: links.live || "" } : { github: "", live: "" },
          images: Array.isArray(images) ? images : [],
          featured: fullProject.featured !== undefined ? fullProject.featured : false,
          status: fullProject.status || "Draft",
          startDate: fullProject.startDate ? new Date(fullProject.startDate).toISOString().split("T")[0] : "",
          releaseDate: fullProject.releaseDate ? new Date(fullProject.releaseDate).toISOString().split("T")[0] : "",
          metaTitle: fullProject.metaTitle || "",
          metaDescription: fullProject.metaDescription || "",
          ogImage: fullProject.ogImage || "",
          teamMembers: teamMembers.map(m => ({ name: m.name, email: m.email || null })),
        });
        setShowModal(true);
      }
    } catch (error) {
      showToast("Failed to load project details", "error");
      onError("Failed to load project details");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateAll(formData)) {
      showToast("Please fix validation errors", "error");
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

      const message = editingProject ? "Project updated successfully!" : "Project created successfully!";
      showToast(message, "success");
      showBanner(message, "success");
      setShowModal(false);
      fetchProjects();
    } catch (error) {
      showToast(error.message || "Failed to save project", "error");
      onError(error.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      showToast("Project deleted successfully", "success");
      showBanner("Project deleted successfully", "success");
      fetchProjects();
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } catch (error) {
      showToast("Failed to delete project", "error");
      onError("Failed to delete project");
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
        showBanner("Status updated", "success");
        fetchProjects();
      }
    } catch (error) {
      showToast("Failed to update status", "error");
    }
  };

  // Bulk actions
  const handleSelectAll = () => {
    setSelectedIds(paginatedProjects.map((p) => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} project(s)?`)) return;

    try {
      const res = await fetch("/api/admin/projects/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", projectIds: selectedIds }),
      });

      if (!res.ok) throw new Error("Failed to delete projects");

      showToast(`${selectedIds.length} project(s) deleted successfully`, "success");
      showBanner(`${selectedIds.length} project(s) deleted successfully`, "success");
      setSelectedIds([]);
      fetchProjects();
    } catch (error) {
      showToast("Failed to delete projects", "error");
    }
  };

  const handleBulkStatusChange = async (status) => {
    try {
      const res = await fetch("/api/admin/projects/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateStatus", projectIds: selectedIds, data: { status } }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      showToast(`Status updated for ${selectedIds.length} project(s)`, "success");
      showBanner(`Status updated for ${selectedIds.length} project(s)`, "success");
      setSelectedIds([]);
      fetchProjects();
    } catch (error) {
      showToast("Failed to update status", "error");
    }
  };

  const handleBulkFeaturedChange = async (featured) => {
    try {
      const res = await fetch("/api/admin/projects/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateFeatured", projectIds: selectedIds, data: { featured } }),
      });

      if (!res.ok) throw new Error("Failed to update featured status");

      showToast(`Featured status updated for ${selectedIds.length} project(s)`, "success");
      showBanner(`Featured status updated for ${selectedIds.length} project(s)`, "success");
      setSelectedIds([]);
      fetchProjects();
    } catch (error) {
      showToast("Failed to update featured status", "error");
    }
  };

  // Export/Import
  const handleExport = async (format = "json") => {
    try {
      const res = await fetch(`/api/admin/projects/export?format=${format}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `projects-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast(`Projects exported as ${format.toUpperCase()}`, "success");
    } catch (error) {
      showToast("Failed to export projects", "error");
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      let projects;
      if (file.name.endsWith(".json")) {
        projects = JSON.parse(text);
      } else if (file.name.endsWith(".csv")) {
        // Simple CSV parser - would need a proper library for complex CSVs
        showToast("CSV import not fully implemented", "warning");
        return;
      } else {
        showToast("Unsupported file format", "error");
        return;
      }

      if (!Array.isArray(projects)) {
        showToast("Invalid file format", "error");
        return;
      }

      const res = await fetch("/api/admin/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects }),
      });

      const result = await res.json();
      if (res.ok) {
        showToast(result.message, "success");
        showBanner(result.message, "success");
        fetchProjects();
      } else {
        showToast(result.message || "Failed to import projects", "error");
      }
    } catch (error) {
      showToast("Failed to import projects", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field] || errors[field]) {
      validateField(field, value, formData);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const allSelected = paginatedProjects.length > 0 && selectedIds.length === paginatedProjects.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < paginatedProjects.length;

  if (loading) {
    return (
      <div>
        <Table bordered hover className="adminWrapper">
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} colCount={6} />
            ))}
          </tbody>
        </Table>
      </div>
    );
  }

  return (
    <div>
      {/* Update Banner */}
      {updateBanner && (
        <Alert
          variant={updateBanner.type === "success" ? "success" : "danger"}
          dismissible
          onClose={() => setUpdateBanner(null)}
          className="mb-3"
        >
          {updateBanner.message}
        </Alert>
      )}

      {/* Stats and Filters */}
      <div className="mb-4">
        <div className="row mb-3">
          <div className="col-md-3">
            <div className="p-3" style={{ backgroundColor: "var(--color-bg-dark-alt)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Total Projects</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)" }}>{stats.total}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3" style={{ backgroundColor: "var(--color-bg-dark-alt)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Published</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#28a745" }}>{stats.published}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3" style={{ backgroundColor: "var(--color-bg-dark-alt)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Drafts</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#6c757d" }}>{stats.drafts}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3" style={{ backgroundColor: "var(--color-bg-dark-alt)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Filtered</div>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-text-primary)" }}>{stats.filtered}</div>
            </div>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-4">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search projects... (Ctrl/Cmd+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ backgroundColor: "var(--color-bg-dark)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
              />
            </InputGroup>
          </div>
          <div className="col-md-3">
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ backgroundColor: "var(--color-bg-dark)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="InProgress">In Progress</option>
              <option value="InProduction">In Production</option>
              <option value="Completed">Completed</option>
            </Form.Select>
          </div>
          <div className="col-md-3">
            <DateRangePicker
              startDate={dateRangeStart}
              endDate={dateRangeEnd}
              onStartDateChange={setDateRangeStart}
              onEndDateChange={setDateRangeEnd}
              label="Date Range"
            />
          </div>
          <div className="col-md-2">
            <Form.Select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              size="sm"
              style={{ backgroundColor: "var(--color-bg-dark)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </Form.Select>
          </div>
        </div>

        {(dateRangeStart || dateRangeEnd) && (
          <div className="mb-2">
            <Button variant="link" size="sm" onClick={() => { setDateRangeStart(null); setDateRangeEnd(null); }}>
              Clear date filter
            </Button>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Projects</h5>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setShowShortcuts(true)}>
            Shortcuts (Ctrl/Cmd+/)
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={() => handleExport("json")}>
            Export JSON
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={() => handleExport("csv")}>
            Export CSV
          </Button>
          <label className="btn btn-outline-secondary btn-sm" style={{ cursor: "pointer", margin: 0 }}>
            Import
            <input type="file" accept=".json,.csv" onChange={handleImport} style={{ display: "none" }} />
          </label>
          <Button onClick={handleCreate}>Create New Project (Ctrl/Cmd+N)</Button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkFeaturedChange={handleBulkFeaturedChange}
        allSelected={allSelected}
        someSelected={someSelected}
        totalCount={filteredProjects.length}
      />

      {/* Empty State */}
      {projects.length === 0 && !loading ? (
        <div className="text-center py-5" style={{ color: "var(--color-text-secondary)" }}>
          <h4 className="mb-3">No projects yet</h4>
          <p className="mb-4">Get started by creating your first project.</p>
          <Button onClick={handleCreate} size="lg">Create Your First Project</Button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-5" style={{ color: "var(--color-text-secondary)" }}>
          <h4 className="mb-3">No projects match your filters</h4>
          <p className="mb-4">Try adjusting your search or filter criteria.</p>
          <Button variant="outline-secondary" onClick={() => { setSearchQuery(""); setStatusFilter("all"); setDateRangeStart(null); setDateRangeEnd(null); }}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <>
          <Table bordered hover className="adminWrapper">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>
                  <Form.Check
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => (e.target.checked ? handleSelectAll() : handleDeselectAll())}
                  />
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("title")}>
                  Title {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th>Status</th>
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("startDate")}>
                  Start Date {sortBy === "startDate" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => handleSort("releaseDate")}>
                  End Date {sortBy === "releaseDate" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProjects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedIds.includes(project.id)}
                      onChange={() => handleToggleSelect(project.id)}
                    />
                  </td>
                  <td>{project.title}</td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={project.status || "Draft"}
                      onChange={(e) => handleStatusChange(project.id, e.target.value)}
                      style={{ width: "auto", display: "inline-block", minWidth: "140px" }}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="InProgress">In Progress</option>
                      <option value="InDevelopment">In Development</option>
                      <option value="InTesting">In Testing</option>
                      <option value="InProduction">In Production</option>
                      <option value="Completed">Completed</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="OnHold">On Hold</option>
                      <option value="Deprecated">Deprecated</option>
                      <option value="Sunsetted">Sunsetted</option>
                    </Form.Select>
                  </td>
                  <td>{formatDate(project.startDate)}</td>
                  <td>{formatDate(project.releaseDate)}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-info"
                      onClick={() => {
                        setFormData({
                          title: project.title || "",
                          slug: project.slug || "",
                          shortDescription: project.shortDescription || "",
                          longDescription: project.longDescription || "",
                          tags: parseJsonField(project.tags, []),
                          techStack: parseJsonField(project.techStack, []),
                          links: parseJsonField(project.links, { github: "", live: "" }),
                          images: parseJsonField(project.images, []),
                          featured: project.featured || false,
                          status: project.status || "Draft",
                          startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
                          releaseDate: project.releaseDate ? new Date(project.releaseDate).toISOString().split("T")[0] : "",
                          metaTitle: project.metaTitle || "",
                          metaDescription: project.metaDescription || "",
                          ogImage: project.ogImage || "",
                          teamMembers: [],
                        });
                        setShowPreview(true);
                      }}
                      className="me-2"
                    >
                      Preview
                    </Button>
                    <Button size="sm" variant="outline-primary" onClick={() => handleEdit(project)} className="me-2">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => handleDuplicate(project)} className="me-2">
                      Duplicate
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(project.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div style={{ color: "var(--color-text-secondary)" }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProjects.length)} of {filteredProjects.length} projects
              </div>
              <Pagination className="mb-0">
                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} />
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page;
                  if (totalPages <= 7) {
                    page = i + 1;
                  } else if (currentPage <= 4) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    page = totalPages - 6 + i;
                  } else {
                    page = currentPage - 3 + i;
                  }
                  return (
                    <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
                      {page}
                    </Pagination.Item>
                  );
                })}
                <Pagination.Next onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered className="adminWrapper">
        <Modal.Header closeButton>
          <div className="d-flex justify-content-between align-items-center w-100 me-3">
            <Modal.Title style={{ color: "var(--color-primary)" }}>
              {editingProject ? "Edit Project" : "Create New Project"}
            </Modal.Title>
            {autosaveStatus && (
              <small style={{ color: autosaveStatus === "saved" ? "#28a745" : "#dc3545" }}>
                {autosaveStatus === "saved" ? "✓ Saved" : "⚠ Save failed"}
              </small>
            )}
          </div>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <div className="row mb-4">
              <div className="col-md-8">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Project Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      updateFormData("title", e.target.value);
                      setFieldTouched("title");
                    }}
                    onBlur={() => setFieldTouched("title")}
                    required
                    placeholder="Enter project title"
                    className="fs-5"
                    isInvalid={!!getFieldError("title")}
                  />
                  {getFieldError("title") && (
                    <Form.Control.Feedback type="invalid">{getFieldError("title")}</Form.Control.Feedback>
                  )}
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => updateFormData("status", e.target.value)}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="InProgress">In Progress</option>
                    <option value="InDevelopment">In Development</option>
                    <option value="InTesting">In Testing</option>
                    <option value="InProduction">In Production</option>
                    <option value="Completed">Completed</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="OnHold">On Hold</option>
                    <option value="Deprecated">Deprecated</option>
                    <option value="Sunsetted">Sunsetted</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Start Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateFormData("startDate", e.target.value)}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">End Date (Release Date)</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.releaseDate}
                    onChange={(e) => updateFormData("releaseDate", e.target.value)}
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">URL Slug *</Form.Label>
              <Form.Control
                type="text"
                value={formData.slug}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                  updateFormData("slug", value);
                  setFieldTouched("slug");
                }}
                onBlur={() => setFieldTouched("slug")}
                required
                placeholder="project-url-slug"
                isInvalid={!!getFieldError("slug")}
              />
              {getFieldError("slug") && (
                <Form.Control.Feedback type="invalid">{getFieldError("slug")}</Form.Control.Feedback>
              )}
              <Form.Text className="text-muted">Used in the project URL (lowercase, hyphens only)</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Short Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.shortDescription}
                onChange={(e) => updateFormData("shortDescription", e.target.value)}
                placeholder="Brief summary of the project (1-2 sentences)"
                maxLength={300}
              />
              <Form.Text className="text-muted">{formData.shortDescription.length}/300 characters</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <MarkdownEditor
                value={formData.longDescription}
                onChange={(value) => updateFormData("longDescription", value)}
                placeholder="Detailed project description (supports Markdown)"
              />
            </Form.Group>

            <hr className="my-4" style={{ borderColor: "var(--color-border)" }} />

            <Form.Group className="mb-4">
              <ImageUploader
                images={formData.images}
                onChange={(images) => updateFormData("images", images)}
                maxImages={10}
              />
            </Form.Group>

            <hr className="my-4" style={{ borderColor: "var(--color-border)" }} />

            <Form.Group className="mb-4">
              <TeamMemberManager
                teamMembers={formData.teamMembers}
                onChange={(members) => updateFormData("teamMembers", members)}
              />
            </Form.Group>

            <hr className="my-4" style={{ borderColor: "var(--color-border)" }} />
            
            <div className="row mb-4">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Project Tags</Form.Label>
                  <div className="d-flex gap-2 mb-2">
                    <Form.Control
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newTag.trim()) {
                            updateFormData("tags", [...formData.tags, newTag.trim()]);
                            setNewTag("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline-primary"
                      onClick={() => {
                        if (newTag.trim()) {
                          updateFormData("tags", [...formData.tags, newTag.trim()]);
                          setNewTag("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                      {formData.tags.map((tag, i) => (
                        <Badge key={i} bg="secondary" className="p-2" style={{ fontSize: "0.875rem" }}>
                          {tag}
                          <button
                            type="button"
                            className="btn-close btn-close-white ms-2"
                            style={{ fontSize: "0.6rem" }}
                            onClick={() => {
                              updateFormData("tags", formData.tags.filter((_, idx) => idx !== i));
                            }}
                            aria-label="Remove tag"
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Tech Stack</Form.Label>
                  <div className="d-flex gap-2 mb-2">
                    <Form.Control
                      type="text"
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      placeholder="Add technology"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newTech.trim()) {
                            updateFormData("techStack", [...formData.techStack, newTech.trim()]);
                            setNewTech("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline-primary"
                      onClick={() => {
                        if (newTech.trim()) {
                          updateFormData("techStack", [...formData.techStack, newTech.trim()]);
                          setNewTech("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {formData.techStack.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                      {formData.techStack.map((tech, i) => (
                        <Badge key={i} bg="primary" className="p-2" style={{ fontSize: "0.875rem" }}>
                          {tech}
                          <button
                            type="button"
                            className="btn-close btn-close-white ms-2"
                            style={{ fontSize: "0.6rem" }}
                            onClick={() => {
                              updateFormData("techStack", formData.techStack.filter((_, idx) => idx !== i));
                            }}
                            aria-label="Remove tech"
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </Form.Group>
              </div>
            </div>

            <hr className="my-4" style={{ borderColor: "var(--color-border)" }} />

            <div className="row mb-4">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">GitHub Repository</Form.Label>
                  <Form.Control
                    type="url"
                    value={formData.links.github}
                    onChange={(e) =>
                      updateFormData("links", { ...formData.links, github: e.target.value })
                    }
                    placeholder="https://github.com/username/repo"
                    isInvalid={!!getFieldError("links")}
                  />
                  {getFieldError("links") && (
                    <Form.Control.Feedback type="invalid">{getFieldError("links")}</Form.Control.Feedback>
                  )}
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Live Site URL</Form.Label>
                  <Form.Control
                    type="url"
                    value={formData.links.live}
                    onChange={(e) =>
                      updateFormData("links", { ...formData.links, live: e.target.value })
                    }
                    placeholder="https://example.com"
                  />
                </Form.Group>
              </div>
            </div>

            <hr className="my-4" style={{ borderColor: "var(--color-border)" }} />

            <h6 className="mb-3">SEO Settings</h6>
            <div className="row mb-4">
              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Meta Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => updateFormData("metaTitle", e.target.value)}
                    placeholder="SEO title (if empty, uses project title)"
                    maxLength={60}
                  />
                  <Form.Text className="text-muted">{formData.metaTitle.length}/60 characters</Form.Text>
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Meta Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.metaDescription}
                    onChange={(e) => updateFormData("metaDescription", e.target.value)}
                    placeholder="SEO description (if empty, uses short description)"
                    maxLength={160}
                  />
                  <Form.Text className="text-muted">{formData.metaDescription.length}/160 characters</Form.Text>
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Open Graph Image URL</Form.Label>
                  <Form.Control
                    type="url"
                    value={formData.ogImage}
                    onChange={(e) => updateFormData("ogImage", e.target.value)}
                    placeholder="https://example.com/og-image.jpg"
                  />
                  <Form.Text className="text-muted">Image URL for social media sharing</Form.Text>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Featured Project"
                checked={formData.featured}
                onChange={(e) => updateFormData("featured", e.target.checked)}
                className="fw-semibold"
              />
              <Form.Text className="text-muted">Featured projects are highlighted on the homepage</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="outline-info"
              onClick={() => {
                setFormData((prev) => ({ ...prev }));
                setShowPreview(true);
              }}
              disabled={saving}
            >
              Preview
            </Button>
            <Button variant="primary" type="submit" size="lg" disabled={saving}>
              {saving ? "Saving..." : editingProject ? "Update Project" : "Create Project"} (Ctrl/Cmd+S)
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <ProjectPreview project={formData} show={showPreview} onHide={() => setShowPreview(false)} />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp show={showShortcuts} onHide={() => setShowShortcuts(false)} />
    </div>
  );
}
