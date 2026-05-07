import { PROJECT_STATUSES, adminStyles } from "../shared";
import { formatAdminDate } from "@/lib/utils/dateUtils";

interface ProjectListItemData {
  id: string;
  title: string;
  status?: string;
  startDate?: string | Date | null;
  releaseDate?: string | Date | null;
}

interface ProjectListItemProps {
  project: ProjectListItemData;
  onEdit: (p: ProjectListItemData) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export default function ProjectListItem({
  project,
  onEdit,
  onDelete,
  onStatusChange,
}: ProjectListItemProps) {
  return (
    <div className="p-4 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4">
      <div className="flex-1 min-w-[200px]">
        <h3 className="font-semibold text-[var(--color-text-primary)]">
          {project.title}
        </h3>
        <div className="text-sm text-[var(--color-text-muted)]">
          {(project.startDate && formatAdminDate(project.startDate)) || "—"} —{" "}
          {project.releaseDate ? formatAdminDate(project.releaseDate) : "Present"}
        </div>
      </div>

      <select
        value={project.status || "Draft"}
        onChange={(e) => onStatusChange(project.id, e.target.value)}
        className="px-3 py-1 text-sm rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
      >
        {PROJECT_STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(project)}
          className="px-3 py-1 text-sm rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(project.id)}
          className={adminStyles.buttonDangerOutline}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
