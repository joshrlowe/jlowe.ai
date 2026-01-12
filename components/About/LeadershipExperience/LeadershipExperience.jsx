/**
 * LeadershipExperience.jsx
 *
 * Enhanced leadership section with impact metrics and visual hierarchy.
 * Designed to showcase leadership achievements prominently for recruiters.
 */

export default function LeadershipExperience({ experience = [] }) {
  if (!experience || experience.length === 0) return null;

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
          <p
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Leading teams and driving organizational impact
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {experience.map((item, index) => (
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
                {item.startDate || item.year} - {item.endDate || "Present"}
              </div>
            </div>

            {/* Scope / Team Size */}
            {item.scope && (
              <p
                className="text-sm mb-3 flex items-center gap-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {item.scope}
              </p>
            )}

            {item.description && (
              <p
                className="mb-4"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {item.description}
              </p>
            )}

            {/* Achievements with metrics emphasis */}
            {item.achievements &&
              Array.isArray(item.achievements) &&
              item.achievements.length > 0 && (
                <div className="space-y-2">
                  <p
                    className="text-xs uppercase tracking-wider font-medium"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Key Achievements
                  </p>
                  <ul className="space-y-2">
                    {item.achievements.map((achievement, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        <svg
                          className="w-4 h-4 mt-1 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="#FAA307"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Skills used */}
            {item.skills &&
              Array.isArray(item.skills) &&
              item.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {item.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded"
                      style={{
                        background: "rgba(250, 163, 7, 0.1)",
                        color: "#FAA307",
                      }}
                    >
                      {skill}
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
