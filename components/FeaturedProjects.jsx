import { useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import styles from "@/styles/FeaturedProjects.module.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function FeaturedProjects({ projects = [] }) {
  const router = useRouter();
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    if (!sectionRef.current || projects.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            if (entry.target.classList.contains(styles.sectionTitle)) {
              gsap.fromTo(
                entry.target,
                { opacity: 0, y: 30 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.8,
                  ease: "power2.out",
                }
              );
            } else {
              const cardIndex = cardsRef.current.indexOf(entry.target);
              gsap.fromTo(
                entry.target,
                { opacity: 0, y: 50, scale: 0.95 },
                {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  duration: 0.6,
                  ease: "power2.out",
                  delay: cardIndex * 0.1,
                }
              );
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    // Observe section title
    const title = sectionRef.current.querySelector(`.${styles.sectionTitle}`);
    if (title) observer.observe(title);

    // Observe project cards
    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => {
      if (title) observer.unobserve(title);
      cardsRef.current.forEach((card) => {
        if (card) observer.unobserve(card);
      });
    };
  }, [projects]);

  if (!projects || projects.length === 0) {
    return null;
  }

  const featuredProjects = projects.filter((p) => p.featured).slice(0, 4);

  if (featuredProjects.length === 0) {
    return null;
  }

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

  return (
    <section ref={sectionRef} id="featured-projects" className={styles.featuredSection} aria-labelledby="featured-projects-title">
      <Container>
        <h2 id="featured-projects-title" className={styles.sectionTitle}>Featured Projects</h2>
        <Row className="g-4">
          {featuredProjects.map((project, index) => {
            const images = parseJsonField(project.images, []);
            const tags = parseJsonField(project.tags, []);
            const techStack = parseJsonField(project.techStack, []);
            let thumbnail = images.length > 0 ? images[0] : null;
            // Handle both string URLs and object format
            if (thumbnail && typeof thumbnail === "object") {
              thumbnail = thumbnail.url || thumbnail.src || thumbnail;
            }
            const thumbnailUrl = typeof thumbnail === "string" ? thumbnail : null;

            const projectUrl = `/projects#${project.slug || project.id}`;
            
            return (
              <Col key={project.id} md={6} lg={featuredProjects.length >= 3 ? 4 : 6}>
                <article
                  ref={(el) => (cardsRef.current[index] = el)}
                  className={styles.projectCard}
                  role="article"
                  onClick={() => router.push(projectUrl)}
                  style={{ cursor: "pointer" }}
                  aria-label={`View project: ${project.title}`}
                >
                    {thumbnailUrl && (
                      <div className={styles.imageContainer}>
                        <Image
                          src={thumbnailUrl}
                          alt={project.title}
                          fill
                          className={styles.projectImage}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          loading="lazy"
                          unoptimized={thumbnailUrl.startsWith("data:") || thumbnailUrl.startsWith("blob:")}
                        />
                      </div>
                    )}
                    {!thumbnailUrl && (
                      <div className={styles.imageContainer} style={{ background: "var(--color-bg-dark)" }}>
                        <div className={styles.placeholderImage}>
                          <span>{project.title.charAt(0)}</span>
                        </div>
                      </div>
                    )}
                    <div className={styles.cardContent}>
                      <h3 className={styles.projectTitle}>{project.title}</h3>
                      {project.shortDescription && (
                        <p className={styles.projectDescription}>
                          {project.shortDescription.length > 120
                            ? `${project.shortDescription.substring(0, 120)}...`
                            : project.shortDescription}
                        </p>
                      )}
                      {tags.length > 0 && (
                        <div className={styles.tags}>
                          {tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className={styles.arrow} aria-hidden="true">→</div>
                    </div>
                  </article>
              </Col>
            );
          })}
        </Row>
        <div className={styles.viewAll}>
          <Link href="/projects" className={styles.viewAllButton}>
            View All Projects
          </Link>
        </div>
      </Container>
    </section>
  );
}

