export default function LeadershipExperience({ experience = [] }) {
  if (!experience || experience.length === 0) return null;

  return (
    <div className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 font-heading">
        Leadership Experience
      </h2>
      <div className="space-y-6">
        {experience.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-[var(--color-bg-darker)]"
          >
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
              {item.role || item.title || item.position}
            </h3>
            <div className="text-[var(--color-primary)] font-medium mt-1">
              {item.organization || item.company}
            </div>
            <div className="text-sm text-[var(--color-text-muted)] mt-1">
              {item.startDate || item.year} - {item.endDate || "Present"}
            </div>
            {item.description && (
              <p className="text-[var(--color-text-secondary)] mt-3">
                {item.description}
              </p>
            )}
            {item.achievements &&
              Array.isArray(item.achievements) &&
              item.achievements.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {item.achievements.map((achievement, i) => (
                    <li
                      key={i}
                      className="text-[var(--color-text-secondary)] flex items-start gap-2"
                    >
                      <span className="text-[var(--color-primary)] mt-1.5">
                        •
                      </span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
