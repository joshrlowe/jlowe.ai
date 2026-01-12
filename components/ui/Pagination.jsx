/**
 * Pagination Component - Reusable pagination controls
 *
 * Extracted from ArticlesPage to reduce duplication.
 */
import { forwardRef } from "react";

export const Pagination = forwardRef(function Pagination(
  {
    currentPage,
    totalPages,
    onPageChange,
    className = "",
    previousLabel = "Previous",
    nextLabel = "Next",
    showPageInfo = true,
    ...props
  },
  ref
) {
  if (totalPages <= 1) return null;

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const handlePrevious = () => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div
      ref={ref}
      className={`flex justify-center items-center gap-4 ${className}`}
      {...props}
    >
      <button
        type="button"
        onClick={handlePrevious}
        disabled={isFirstPage}
        className="px-4 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={`Go to previous page`}
      >
        {previousLabel}
      </button>

      {showPageInfo && (
        <span
          className="text-[var(--color-text-secondary)]"
          aria-live="polite"
          aria-atomic="true"
        >
          Page {currentPage} of {totalPages}
        </span>
      )}

      <button
        type="button"
        onClick={handleNext}
        disabled={isLastPage}
        className="px-4 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={`Go to next page`}
      >
        {nextLabel}
      </button>
    </div>
  );
});

export default Pagination;

