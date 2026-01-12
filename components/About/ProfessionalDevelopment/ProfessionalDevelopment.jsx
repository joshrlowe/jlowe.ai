/**
 * ProfessionalDevelopment.jsx
 *
 * Showcases growth-oriented activities:
 * - Training delivered
 * - Mentorship given
 * - Certifications earned
 * - Workshops/conferences attended
 * - Publications/speaking
 */

export default function ProfessionalDevelopment({ development = [] }) {
  if (!development || development.length === 0) return null;

  // Group by type for better organization
  const grouped = development.reduce((acc, item) => {
    const type = item.type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  const typeConfig = {
    training: {
      label: "Training Delivered",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
          />
        </svg>
      ),
      color: "#4CC9F0",
    },
    mentorship: {
      label: "Mentorship",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      ),
      color: "#FAA307",
    },
    speaking: {
      label: "Speaking & Publications",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
          />
        </svg>
      ),
      color: "#E85D04",
    },
    course: {
      label: "Courses & Learning",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      ),
      color: "#10b981",
    },
    other: {
      label: "Professional Development",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      ),
      color: "#a855f7",
    },
  };

  return (
    <div className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(76, 201, 240, 0.15)",
            border: "1px solid rgba(76, 201, 240, 0.3)",
          }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#4CC9F0"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
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
            Professional Development
          </h2>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Continuous growth and knowledge sharing
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([type, items]) => {
          const config = typeConfig[type] || typeConfig.other;
          return (
            <div key={type}>
              {/* Type Header */}
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: `${config.color}15`,
                    color: config.color,
                  }}
                >
                  {config.icon}
                </div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {config.label}
                </h3>
              </div>

              {/* Items */}
              <div className="grid gap-3 ml-10">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg transition-all duration-300"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4
                          className="font-medium"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {item.title}
                        </h4>
                        {item.organization && (
                          <p
                            className="text-sm mt-1"
                            style={{ color: config.color }}
                          >
                            {item.organization}
                          </p>
                        )}
                        {item.description && (
                          <p
                            className="text-sm mt-2"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.date && (
                        <span
                          className="text-xs shrink-0"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {item.date}
                        </span>
                      )}
                    </div>

                    {/* Impact metric if provided */}
                    {item.impact && (
                      <div
                        className="mt-3 text-sm flex items-center gap-2"
                        style={{ color: config.color }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                        {item.impact}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

