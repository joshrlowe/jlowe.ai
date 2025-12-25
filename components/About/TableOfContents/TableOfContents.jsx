import { useEffect, useState } from "react";
import styles from "./TableOfContents.module.css";

const sections = [
  { id: "section-hero", label: "Profile" },
  { id: "section-summary", label: "Summary" },
  { id: "section-skills", label: "Skills" },
  { id: "section-experience", label: "Experience" },
  { id: "section-education", label: "Education" },
  { id: "section-certifications", label: "Certifications" },
  { id: "section-leadership", label: "Leadership" },
  { id: "section-hobbies", label: "Hobbies" },
];

export default function TableOfContents({ activeSection }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleScroll = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <nav className={styles.tableOfContents} aria-label="Table of Contents">
      <h3 className={styles.tocTitle}>Contents</h3>
      <ul className={styles.tocList}>
        {sections.map((section) => {
          const isActive = activeSection === section.id;

          return (
            <li key={section.id} className={styles.tocItem}>
              <button
                onClick={() => handleScroll(section.id)}
                className={`${styles.tocLink} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "true" : "false"}
              >
                {section.label}
              </button>
            </li>
          );
        })}
      </ul>
      
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={styles.backToTop}
        aria-label="Back to top"
      >
        ↑ Back to Top
      </button>
    </nav>
  );
}

