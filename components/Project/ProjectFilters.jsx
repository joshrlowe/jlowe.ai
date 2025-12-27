/**
 * ProjectFilters.jsx
 *
 * Filter controls for projects with space-themed styling.
 */

export default function ProjectFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  tagFilter,
  onTagFilterChange,
  availableTags,
  availableStatuses,
  onClearFilters,
}) {
  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || tagFilter !== "all";

  return (
    <div className="glass-card p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <label htmlFor="search" className="sr-only">
            Search projects
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              id="search"
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="sr-only">
            Filter by status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer transition-colors"
          >
            <option value="all">All Statuses</option>
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replace(/([A-Z])/g, " $1").trim()}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Filter */}
        <div>
          <label htmlFor="tag" className="sr-only">
            Filter by tag
          </label>
          <select
            id="tag"
            value={tagFilter}
            onChange={(e) => onTagFilterChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-darker)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer transition-colors"
          >
            <option value="all">All Tags</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <span className="badge">Search: "{searchQuery}"</span>
            )}
            {statusFilter !== "all" && (
              <span className="badge badge-secondary">
                Status: {statusFilter}
              </span>
            )}
            {tagFilter !== "all" && (
              <span className="badge badge-accent">Tag: {tagFilter}</span>
            )}
          </div>
          <button
            onClick={onClearFilters}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
