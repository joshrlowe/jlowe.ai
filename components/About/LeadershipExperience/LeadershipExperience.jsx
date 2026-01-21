/**
 * LeadershipExperience.jsx
 *
 * Leadership section with markdown description support.
 * Simplified structure matching Professional Experience.
 */

import { MarkdownContent } from "@/components/ui";

/**
 * Format a date string to "Month Year" format
 * @param {string} dateStr - ISO date string or date-like string
 * @returns {string} Formatted date like "December 2020"
 */
function formatDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // Return as-is if invalid
    
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr; // Return as-is if parsing fails
  }
}

/**
 * Sort experiences by start date (most recent first)
 * @param {Array} experiences - Array of experience objects
 * @returns {Array} Sorted array
 */
function sortByDateDesc(experiences) {
  return [...experiences].sort((a, b) => {
    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return dateB - dateA; // Most recent first
  });
}

export default function LeadershipExperience({ experience = [], subtitle = "" }) {
  if (!experience || experience.length === 0) return null;

  // Sort experiences chronologically (most recent first)
  const sortedExperience = sortByDateDesc(experience);

  return (
    <div className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(250, 163, 7, 0.15)",
            border: "1px solid rgba(250, 163, 7, 0.3)",
          }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#FAA307"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
        </div>
        <div>
          <h2
            className="text-2xl font-bold"
            style={{
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-family-heading)",
            }}
          >
            Leadership Experience
          </h2>
          {subtitle && (
            <p
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {sortedExperience.map((item, index) => {
          // Format dates for display
          const startFormatted = formatDate(item.startDate) || item.year;
          const endFormatted = item.endDate ? formatDate(item.endDate) : "Present";

          return (
            <div
              key={index}
              className="relative p-5 rounded-lg transition-all duration-300 hover:border-[var(--color-accent)]"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              {/* Role Badge */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3
                    className="text-xl font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {item.role || item.title || item.position}
                  </h3>
                  <div
                    className="font-medium mt-1"
                    style={{ color: "#FAA307" }}
                  >
                    {item.organization || item.company}
                  </div>
                </div>
                <div
                  className="text-sm px-3 py-1 rounded-full shrink-0"
                  style={{
                    background: "rgba(250, 163, 7, 0.1)",
                    color: "#FAA307",
                    border: "1px solid rgba(250, 163, 7, 0.2)",
                  }}
                >
                  {startFormatted} - {endFormatted}
                </div>
              </div>

              {/* Description - Markdown rendered */}
              {item.description && (
                <div className="mt-3">
                  <MarkdownContent
                    content={item.description}
                    variant="compact"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
