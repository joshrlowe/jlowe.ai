import { useEffect, useRef, useState } from "react";
import { Container } from "react-bootstrap";
import { gsap } from "gsap";
import styles from "@/styles/TechStackShowcase.module.css";

export default function TechStackShowcase({ projects = [] }) {
  const sectionRef = useRef(null);
  const [techStack, setTechStack] = useState([]);
  const [selectedTech, setSelectedTech] = useState(null);
  const iconsRef = useRef([]);

  useEffect(() => {
    // Extract unique technologies from projects
    const parseJsonField = (field, defaultValue = []) => {
      if (!field) return defaultValue;
      if (typeof field === "string") {
        try {
          return JSON.parse(field);
        } catch {
          return defaultValue;
        }
      }
      return Array.isArray(field) ? field : defaultValue;
    };

    const techMap = new Map();
    
    projects.forEach((project) => {
      const techs = parseJsonField(project.techStack, []);
      techs.forEach((tech) => {
        const techName = typeof tech === "string" ? tech : tech.name || tech;
        if (techMap.has(techName)) {
          techMap.set(techName, techMap.get(techName) + 1);
        } else {
          techMap.set(techName, 1);
        }
      });
    });

    const techArray = Array.from(techMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12); // Show top 12 technologies

    setTechStack(techArray);
  }, [projects]);

  useEffect(() => {
    if (!sectionRef.current || techStack.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const icon = iconsRef.current[index];
            if (icon) {
              gsap.fromTo(
                icon,
                { opacity: 0, scale: 0, rotation: -180 },
                {
                  opacity: 1,
                  scale: 1,
                  rotation: 0,
                  duration: 0.6,
                  delay: index * 0.05,
                  ease: "back.out(1.7)",
                }
              );
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    iconsRef.current.forEach((icon) => {
      if (icon) observer.observe(icon);
    });

    return () => {
      iconsRef.current.forEach((icon) => {
        if (icon) observer.unobserve(icon);
      });
    };
  }, [techStack]);

  if (techStack.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className={styles.techSection} aria-label="Technology stack">
      <Container>
        <h2 className={styles.sectionTitle}>Technologies I Work With</h2>
        <div className={styles.techGrid}>
          {techStack.map((tech, index) => (
            <div
              key={tech.name}
              ref={(el) => (iconsRef.current[index] = el)}
              className={styles.techItem}
              onClick={() => setSelectedTech(selectedTech === tech.name ? null : tech.name)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedTech(selectedTech === tech.name ? null : tech.name);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${tech.name} - used in ${tech.count} project${tech.count !== 1 ? "s" : ""}`}
            >
              <div className={styles.techIcon}>
                <span className={styles.techInitial}>{tech.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className={styles.techInfo}>
                <div className={styles.techName}>{tech.name}</div>
                <div className={styles.techCount}>{tech.count} project{tech.count !== 1 ? "s" : ""}</div>
              </div>
              {selectedTech === tech.name && (
                <div className={styles.techTooltip} role="tooltip">
                  Used in {tech.count} project{tech.count !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

