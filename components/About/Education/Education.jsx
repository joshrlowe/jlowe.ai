/**
 * Formats date for display - extracts year from ISO date or returns as-is
 */
function formatDate(dateStr) {
  if (!dateStr) return null;
  
  // If already just a year (e.g., "2024"), return as-is
  if (/^\d{4}$/.test(dateStr)) return dateStr;
  
  // If ISO date format (e.g., "2024-05-15"), extract year
  if (/^\d{4}-\d{2}/.test(dateStr)) {
    try {
      const [year, month] = dateStr.split("-").map(Number);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[month - 1]} ${year}`;
    } catch {
      return dateStr;
    }
  }
  
  return dateStr;
}

/**
 * Gets the date range display for education
 */
function getDateRange(edu) {
  // Check for various date field formats
  if (edu.graduationYear) return edu.graduationYear;
  if (edu.year) return edu.year;
  
  // Handle startDate/endDate format (from admin form)
  const startDate = formatDate(edu.startDate);
  const endDate = edu.isOngoing 
    ? (edu.expectedGradDate ? `Expected ${formatDate(edu.expectedGradDate)}` : "Present")
    : formatDate(edu.endDate);
  
  // Handle legacy startYear/endYear format
  const startYear = startDate || edu.startYear;
  const endYear = endDate || edu.endYear;
  
  if (startYear && endYear) {
    return `${startYear} — ${endYear}`;
  }
  if (startYear) {
    return `${startYear} — Present`;
  }
  
  return null;
}

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
        {education.map((edu, index) => {
          const dateRange = getDateRange(edu);
          const isOngoing = edu.isOngoing || false;
          
          return (
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
                {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
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
                {dateRange && (
                  <span className="flex items-center gap-1">
                    {dateRange}
                    {isOngoing && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[var(--color-primary)] bg-opacity-20 text-[var(--color-primary)]">
                        In Progress
                      </span>
                    )}
                  </span>
                )}
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

              {/* Relevant Coursework */}
              {edu.relevantCoursework &&
                Array.isArray(edu.relevantCoursework) &&
                edu.relevantCoursework.length > 0 && (
                  <div className="mt-3">
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Relevant Coursework:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {edu.relevantCoursework.map((course, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs rounded"
                          style={{
                            background: "var(--color-bg-card)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
