const sections = [
  { id: "section-hero", label: "Overview" },
  { id: "section-summary", label: "Summary" },
  { id: "section-skills", label: "Technical Skills" },
  { id: "section-experience", label: "Experience" },
  { id: "section-education", label: "Education" },
  { id: "section-certifications", label: "Certifications" },
  { id: "section-leadership", label: "Leadership" },
  { id: "section-hobbies", label: "Hobbies" },
];

export default function TableOfContents({ activeSection }) {
  const handleClick = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      // Calculate offset to account for fixed header (approximately 80px)
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
        Contents
      </h3>
      <ul className="space-y-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={(e) => handleClick(e, section.id)}
              className={`block py-2 px-3 rounded-lg text-sm transition-all duration-200 ${
                activeSection === section.id
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)]"
              }`}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
