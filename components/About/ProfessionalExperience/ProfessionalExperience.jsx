import { MarkdownContent } from "@/components/ui";

/**
 * Formats date for display
 * Handles both ISO date strings and formatted dates
 */
function formatDate(dateStr) {
  if (!dateStr) return null;
  
  // If already formatted (e.g., "Jan 2024"), return as-is
  if (!/^\d{4}-\d{2}/.test(dateStr)) return dateStr;
  
  try {
    // Parse the date parts directly to avoid timezone issues
    const [year, month] = dateStr.split("-").map(Number);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[month - 1]} ${year}`;
  } catch {
    return dateStr;
  }
}

export default function ProfessionalExperience({ experience = [] }) {
  if (!experience || experience.length === 0) return null;

  return (
    <div className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 font-heading">
        Professional Experience
      </h2>
      <div className="space-y-8">
        {experience.map((job, index) => {
          const role = job.role || job.title || job.position;
          const company = job.company || job.organization;
          const startDate = formatDate(job.startDate);
          const endDate = job.isOngoing ? "Present" : formatDate(job.endDate) || "Present";

          return (
            <div
              key={index}
              className="relative pl-6 border-l-2 border-[var(--color-primary)]"
              data-testid={`experience-entry-${index}`}
            >
              <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[var(--color-primary)]" />
              
              {/* Role/Title - Largest text (h3) */}
              <h3
                className="text-xl font-bold text-[var(--color-text-primary)]"
                data-testid={`experience-role-${index}`}
              >
                {role}
              </h3>
              
              {/* Organization/Company - Smaller than role */}
              <p
                className="text-base font-medium text-[var(--color-primary)] mt-1"
                data-testid={`experience-company-${index}`}
              >
                {company}
              </p>
              
              {/* Timeline - Muted styling */}
              <p
                className="text-sm text-[var(--color-text-muted)] mt-1"
                data-testid={`experience-timeline-${index}`}
              >
                {startDate} — {endDate}
                {job.location && ` • ${job.location}`}
              </p>
              
              {/* Description - Markdown rendered */}
              {job.description && (
                <div className="mt-3" data-testid={`experience-description-${index}`}>
                  <MarkdownContent
                    content={job.description}
                    variant="compact"
                  />
                </div>
              )}
              
              {/* Achievements/Responsibilities */}
              {job.achievements &&
                Array.isArray(job.achievements) &&
                job.achievements.length > 0 && (
                  <ul className="mt-3 space-y-2" data-testid={`experience-achievements-${index}`}>
                    {job.achievements.map((item, i) => (
                      <li
                        key={i}
                        className="text-[var(--color-text-secondary)] flex items-start gap-2"
                      >
                        <span className="text-[var(--color-primary)] mt-1.5">
                          •
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              
              {/* Legacy: responsibilities field (for backward compatibility) */}
              {job.responsibilities &&
                Array.isArray(job.responsibilities) &&
                job.responsibilities.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {job.responsibilities.map((item, i) => (
                      <li
                        key={i}
                        className="text-[var(--color-text-secondary)] flex items-start gap-2"
                      >
                        <span className="text-[var(--color-primary)] mt-1.5">
                          •
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              
              {/* Technologies */}
              {job.technologies &&
                Array.isArray(job.technologies) &&
                job.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {job.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs rounded bg-[var(--color-bg-darker)] text-[var(--color-text-muted)]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
