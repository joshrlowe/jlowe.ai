export default function Education({ education = [] }) {
  if (!education || education.length === 0) return null;

  return (
    <div
      className="p-6 sm:p-8 rounded-xl"
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h2
        className="text-2xl font-bold mb-6 font-heading"
        style={{ color: "var(--color-text-primary)" }}
      >
        Education
      </h2>
      <div className="space-y-6">
        {education.map((edu, index) => (
          <div
            key={index}
            className="p-4 sm:p-5 rounded-lg"
            style={{ background: "var(--color-bg-darker)" }}
          >
            {/* Degree - full width, proper wrapping */}
            <h3
              className="text-lg sm:text-xl font-semibold font-heading leading-snug"
              style={{ color: "var(--color-text-primary)" }}
            >
              {edu.degree}
            </h3>

            {/* Institution */}
            <div
              className="font-medium mt-1 text-base"
              style={{ color: "var(--color-primary)" }}
            >
              {edu.institution || edu.school}
            </div>

            {/* Year and location - inline */}
            <div
              className="text-sm mt-1 flex flex-wrap items-center gap-x-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span>
                {edu.graduationYear ||
                  edu.year ||
                  `${edu.startYear} - ${edu.endYear}`}
              </span>
              {edu.location && (
                <>
                  <span>•</span>
                  <span>{edu.location}</span>
                </>
              )}
            </div>

            {edu.gpa && (
              <div
                className="text-sm mt-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                GPA: {edu.gpa}
              </div>
            )}

            {edu.honors && (
              <div
                className="text-sm mt-2"
                style={{ color: "var(--color-primary)" }}
              >
                {edu.honors}
              </div>
            )}

            {edu.description && (
              <p
                className="mt-3 leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {edu.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
