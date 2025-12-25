import { useEffect, useRef } from "react";
import { Container } from "react-bootstrap";
import { gsap } from "gsap";
import styles from "@/styles/SkillsTimeline.module.css";

export default function SkillsTimeline({ projects = [] }) {
  const sectionRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current || projects.length === 0) return;

    // Extract technologies by year
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

    const techByYear = new Map();
    
    projects.forEach((project) => {
      if (!project.startDate) return;
      const year = new Date(project.startDate).getFullYear();
      const techs = parseJsonField(project.techStack, []);
      
      techs.forEach((tech) => {
        const techName = typeof tech === "string" ? tech : tech.name || tech;
        if (!techByYear.has(year)) {
          techByYear.set(year, new Set());
        }
        techByYear.get(year).add(techName);
      });
    });

    const sortedYears = Array.from(techByYear.keys()).sort((a, b) => b - a);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll(`.${styles.timelineItem}`);
            items.forEach((item, index) => {
              gsap.fromTo(
                item,
                { opacity: 0, x: -50 },
                {
                  opacity: 1,
                  x: 0,
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: "power2.out",
                }
              );
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }

    return () => {
      if (timelineRef.current) {
        observer.unobserve(timelineRef.current);
      }
    };
  }, [projects]);

  if (projects.length === 0) {
    return null;
  }

  // Group technologies by year
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

  const techByYear = new Map();
  
  projects.forEach((project) => {
    if (!project.startDate) return;
    const year = new Date(project.startDate).getFullYear();
    const techs = parseJsonField(project.techStack, []);
    
    techs.forEach((tech) => {
      const techName = typeof tech === "string" ? tech : tech.name || tech;
      if (!techByYear.has(year)) {
        techByYear.set(year, new Set());
      }
      techByYear.get(year).add(techName);
    });
  });

  const sortedYears = Array.from(techByYear.keys()).sort((a, b) => b - a);

  if (sortedYears.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className={styles.timelineSection} aria-label="Technology timeline">
      <Container>
        <h2 className={styles.sectionTitle}>Technology Journey</h2>
        <div ref={timelineRef} className={styles.timeline}>
          {sortedYears.map((year, index) => (
            <div key={year} className={styles.timelineItem}>
              <div className={styles.yearMarker}>
                <span className={styles.year}>{year}</span>
              </div>
              <div className={styles.techList}>
                {Array.from(techByYear.get(year)).slice(0, 8).map((tech) => (
                  <span key={tech} className={styles.techBadge}>
                    {tech}
                  </span>
                ))}
                {Array.from(techByYear.get(year)).length > 8 && (
                  <span className={styles.moreTech}>
                    +{Array.from(techByYear.get(year)).length - 8} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

