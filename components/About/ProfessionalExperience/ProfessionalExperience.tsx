import { MarkdownContent } from "@/components/ui";

interface ExperienceEntry {
  role?: string;
  title?: string;
  position?: string;
  company?: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  isOngoing?: boolean;
  location?: string;
  description?: string;
  technologies?: string[];
}

function formatDate(dateStr?: string): string | null {
  if (!dateStr) return null;

  if (!/^\d{4}-\d{2}/.test(dateStr)) return dateStr;

  try {
    const [year, month] = dateStr.split("-").map(Number);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[month - 1]} ${year}`;
  } catch {
    return dateStr;
  }
}

interface ProfessionalExperienceProps {
  experience?: ExperienceEntry[];
}

export default function ProfessionalExperience({
  experience = [],
}: ProfessionalExperienceProps) {
  if (!experience || experience.length === 0) return null;

  return (
    <div className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 font-heading">
        Professional Experience
      </h2>
      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-[var(--color-primary)] opacity-30" />

        <div className="space-y-8">
          {experience.map((job, index) => {
            const role = job.role || job.title || job.position;
            const company = job.company || job.organization;
            const startDate = formatDate(job.startDate);
            const endDate = job.isOngoing ? "Present" : formatDate(job.endDate) || "Present";
            const isOngoing = job.isOngoing || !job.endDate;

            return (
              <div
                key={index}
                className="relative pl-8"
                data-testid={`experience-entry-${index}`}
              >
                <div className="absolute left-0 top-1.5 flex items-center justify-center">
                  {isOngoing ? (
                    <div className="relative">
                      <div className="w-4 h-4 rounded-full bg-[var(--color-primary)]" />
                      <div className="absolute inset-0 w-4 h-4 rounded-full bg-[var(--color-primary)] animate-ping opacity-75" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-[var(--color-primary)]" />
                  )}
                </div>

                <h3
                  className="text-xl font-bold text-[var(--color-text-primary)]"
                  data-testid={`experience-role-${index}`}
                >
                  {role}
                </h3>

                <p
                  className="text-base font-medium text-[var(--color-primary)] mt-1"
                  data-testid={`experience-company-${index}`}
                >
                  {company}
                </p>

                <p
                  className="text-sm text-[var(--color-text-muted)] mt-1"
                  data-testid={`experience-timeline-${index}`}
                >
                  {startDate} — {endDate}
                  {job.location && ` • ${job.location}`}
                </p>

                {job.description && (
                  <div className="mt-3" data-testid={`experience-description-${index}`}>
                    <MarkdownContent
                      content={job.description}
                      variant="compact"
                    />
                  </div>
                )}

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
    </div>
  );
}
