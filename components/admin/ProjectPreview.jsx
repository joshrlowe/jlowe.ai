import { parseJsonField } from "@/lib/utils/jsonUtils";

export default function ProjectPreview({ project, show, onHide }) {
  if (!show || !project) return null;

  const tags = parseJsonField(project.tags, []);
  const techStack = parseJsonField(project.techStack, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="fixed inset-0 bg-black/70" onClick={onHide} />
      <div className="relative z-10 w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 sm:p-8 mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--color-primary)]">
            Preview
          </h2>
          <button
            onClick={onHide}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-darker)] transition-colors"
            aria-label="Close preview"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {project.title || "Untitled"}
          </h1>

          <div className="flex flex-wrap gap-2">
            <span
              className={`px-2 py-1 text-xs rounded ${project.status === "Published" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}
            >
              {project.status}
            </span>
            {project.featured && (
              <span className="px-2 py-1 text-xs rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                Featured
              </span>
            )}
          </div>

          {project.shortDescription && (
            <p className="text-[var(--color-text-secondary)]">
              {project.shortDescription}
            </p>
          )}

          {techStack.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs rounded bg-[var(--color-bg-darker)] text-[var(--color-text-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.longDescription && (
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Description
              </h3>
              <div className="text-[var(--color-text-secondary)] whitespace-pre-line">
                {project.longDescription}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onHide}
          className="mt-6 w-full px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] transition-colors"
        >
          Close Preview
        </button>
      </div>
    </div>
  );
}
