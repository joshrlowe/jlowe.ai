/**
 * ProjectsEmptyState.jsx
 *
 * Empty state display for when no projects match filters.
 */

import Link from "next/link";

export default function ProjectsEmptyState({ hasFilters, onClearFilters }) {
  return (
    <div className="text-center py-20">
      <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center">
        <svg
          className="w-12 h-12 text-[var(--color-text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>

      <h3 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3 font-heading">
        {hasFilters ? "No matching projects" : "No projects yet"}
      </h3>

      <p
        className="text-[var(--color-text-secondary)] mx-auto mb-8"
        style={{ maxWidth: "80%" }}
      >
        {hasFilters
          ? "Try adjusting your filters or search query to find what you're looking for."
          : "Projects will appear here once they're published. Check back soon!"}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {hasFilters ? (
          <button onClick={onClearFilters} className="btn btn-primary">
            Clear Filters
          </button>
        ) : (
          <Link href="/" className="btn btn-primary">
            Return Home
          </Link>
        )}

        <Link href="/contact" className="btn btn-secondary">
          Get in Touch
        </Link>
      </div>
    </div>
  );
}
