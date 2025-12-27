export default function ProfessionalExperience({ experience = [] }) {
  if (!experience || experience.length === 0) return null;

  return (
    <div className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 font-heading">
        Professional Experience
      </h2>
      <div className="space-y-8">
        {experience.map((job, index) => (
          <div
            key={index}
            className="relative pl-6 border-l-2 border-[var(--color-primary)]"
          >
            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[var(--color-primary)]" />
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {job.title || job.position}
            </h3>
            <div className="text-[var(--color-primary)] font-medium mt-1">
              {job.company || job.organization}
            </div>
            <div className="text-sm text-[var(--color-text-muted)] mt-1">
              {job.startDate} - {job.endDate || "Present"}
              {job.location && ` • ${job.location}`}
            </div>
            {job.description && (
              <p className="text-[var(--color-text-secondary)] mt-3">
                {job.description}
              </p>
            )}
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
        ))}
      </div>
    </div>
  );
}
