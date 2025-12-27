export default function TechnicalSkills({ skills = [] }) {
  if (!skills || skills.length === 0) return null;

  return (
    <div className="p-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6 font-heading">
        Technical Skills
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skills.map((skillGroup, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-[var(--color-bg-darker)]"
          >
            <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-3">
              {skillGroup.category || skillGroup.name || "Skills"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(skillGroup.skills || skillGroup.items || []).map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-sm rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                >
                  {typeof skill === "string" ? skill : skill.name || skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
