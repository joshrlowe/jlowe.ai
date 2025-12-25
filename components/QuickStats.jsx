import { useEffect, useRef, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { gsap } from "gsap";
import styles from "@/styles/QuickStats.module.css";

export default function QuickStats({ projects = [], aboutData = null }) {
  const sectionRef = useRef(null);
  const [countersStarted, setCountersStarted] = useState(false);

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

  const calculateStats = () => {
    const publishedProjects = projects.filter((p) => p.status === "Published");
    const techStack = publishedProjects.reduce((acc, project) => {
      const tech = parseJsonField(project.techStack, []);
      return [...acc, ...tech];
    }, []);
    const uniqueTechs = [...new Set(techStack)];

    // Calculate years of experience from oldest project or about data
    let yearsExperience = 0;
    if (publishedProjects.length > 0) {
      const oldestProject = publishedProjects.reduce((oldest, project) => {
        if (!project.startDate) return oldest;
        const projectDate = new Date(project.startDate);
        if (!oldest || projectDate < oldest) return projectDate;
        return oldest;
      }, null);
      if (oldestProject) {
        const years = new Date().getFullYear() - oldestProject.getFullYear();
        yearsExperience = Math.max(years, 1);
      }
    }

    return {
      projects: publishedProjects.length,
      technologies: uniqueTechs.length,
      experience: yearsExperience,
    };
  };

  const stats = calculateStats();
  const [displayedStats, setDisplayedStats] = useState({
    projects: 0,
    technologies: 0,
    experience: 0,
  });

  const animateCounters = () => {
    const duration = 2;
    const ease = "power2.out";

    gsap.to(
      {},
      {
        duration,
        ease,
        onUpdate: function () {
          const progress = this.progress();
          setDisplayedStats({
            projects: Math.floor(stats.projects * progress),
            technologies: Math.floor(stats.technologies * progress),
            experience: Math.floor(stats.experience * progress),
          });
        },
      }
    );
  };

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !countersStarted) {
            setCountersStarted(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [countersStarted]);

  useEffect(() => {
    if (countersStarted) {
      animateCounters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countersStarted]);

  return (
    <section ref={sectionRef} className={styles.statsSection} aria-label="Statistics">
      <Container>
        <Row className="g-4">
          <Col md={4}>
            <div className={styles.statCard} role="region" aria-label="Projects completed">
              <div className={styles.statNumber} aria-live="polite">{displayedStats.projects}+</div>
              <div className={styles.statLabel}>Projects Completed</div>
            </div>
          </Col>
          <Col md={4}>
            <div className={styles.statCard} role="region" aria-label="Technologies used">
              <div className={styles.statNumber} aria-live="polite">{displayedStats.technologies}+</div>
              <div className={styles.statLabel}>Technologies</div>
            </div>
          </Col>
          <Col md={4}>
            <div className={styles.statCard} role="region" aria-label="Years of experience">
              <div className={styles.statNumber} aria-live="polite">{displayedStats.experience}+</div>
              <div className={styles.statLabel}>Years Experience</div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

