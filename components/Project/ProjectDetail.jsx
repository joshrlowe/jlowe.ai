import { useEffect, useRef } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import ReactMarkdown from "react-markdown";
import styles from "@/styles/ProjectDetail.module.css";
import StatusBadge from "./StatusBadge";
import ProjectTechStack from "./ProjectTechStack";
import ProjectTeam from "./ProjectTeam";

export default function ProjectDetail({ project }) {
  const containerRef = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(
              entry.target,
              { opacity: 0, y: 30 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
              }
            );
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = containerRef.current.querySelectorAll(`.${styles.section}`);
    sections.forEach((section) => observer.observe(section));

    // Hero animation
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        }
      );
    }

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const parseJsonField = (field, defaultValue = null) => {
    if (!field) return defaultValue;
    if (typeof field === "string") {
      try {
        return JSON.parse(field);
      } catch {
        return defaultValue;
      }
    }
    return field;
  };

  const images = parseJsonField(project.images, []);
  const tags = parseJsonField(project.tags, []);
  const links = parseJsonField(project.links, {});
  const techStack = parseJsonField(project.techStack, {});

  return (
    <Container ref={containerRef} className={styles.projectDetail}>
      {/* Back Button */}
      <div className={styles.backButton}>
        <Link href="/projects" className={styles.backLink}>
          ← Back to Projects
        </Link>
      </div>

      {/* Hero Section */}
      <div ref={heroRef} className={styles.hero}>
        {images.length > 0 && (
          <div className={styles.heroImage}>
            <Image
              src={typeof images[0] === "string" ? images[0] : images[0]?.url || images[0]?.src || images[0]}
              alt={project.title}
              fill
              className={styles.heroImageImg}
              priority
              sizes="100vw"
              unoptimized={
                (typeof images[0] === "string" && (images[0].startsWith("data:") || images[0].startsWith("blob:"))) ||
                (typeof images[0] === "object" && images[0] && (images[0].url?.startsWith("data:") || images[0].url?.startsWith("blob:")))
              }
            />
          </div>
        )}
        <div className={styles.heroContent}>
          <div className={styles.heroHeader}>
            <h1 className={styles.projectTitle}>{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          {project.shortDescription && (
            <p className={styles.heroDescription}>{project.shortDescription}</p>
          )}
          {(links.github || links.live) && (
            <div className={styles.heroLinks}>
              {links.github && (
                <Button
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  className={styles.actionButton}
                  as="a"
                >
                  View on GitHub
                </Button>
              )}
              {links.live && (
                <Button
                  href={links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline-primary"
                  className={styles.actionButton}
                  as="a"
                >
                  Visit Live Site
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Project Metadata */}
      <div className={`${styles.section} ${styles.metadata}`}>
        <Row className="g-4">
          {project.startDate && (
            <Col md={3} sm={6}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Start Date</span>
                <span className={styles.metaValue}>
                  {new Date(project.startDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </Col>
          )}
          {project.releaseDate && (
            <Col md={3} sm={6}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Release Date</span>
                <span className={styles.metaValue}>
                  {new Date(project.releaseDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </Col>
          )}
          {tags.length > 0 && (
            <Col md={6} sm={12}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Tags</span>
                <div className={styles.tags}>
                  {tags.map((tag, i) => (
                    <span key={i} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Col>
          )}
        </Row>
      </div>

      {/* Description */}
      {(project.longDescription || project.description) && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>About This Project</h2>
          <div className={styles.description}>
            {project.longDescription ? (
              <ReactMarkdown>{project.longDescription}</ReactMarkdown>
            ) : (
              <p>{project.description}</p>
            )}
          </div>
        </section>
      )}

      {/* Tech Stack */}
      {techStack && typeof techStack === "object" && Object.keys(techStack).length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Technology Stack</h2>
          <ProjectTechStack techStack={techStack} />
        </section>
      )}

      {/* Team */}
      {project.team && project.team.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {project.team.length > 1 ? "Team" : "Author"}
          </h2>
          <ProjectTeam team={project.team} />
        </section>
      )}

      {/* Image Gallery */}
      {images.length > 1 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Gallery</h2>
          <div className={styles.gallery}>
            {images.slice(1).map((image, index) => (
              <div key={index} className={styles.galleryItem}>
                <Image
                  src={typeof image === "string" ? image : image.url || image}
                  alt={`${project.title} - Image ${index + 2}`}
                  fill
                  className={styles.galleryImage}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

