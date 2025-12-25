import { useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useRouter } from "next/router";
import { gsap } from "gsap";
import Link from "next/link";
import Image from "next/image";
import styles from "@/styles/RecentResources.module.css";

export default function RecentResources({ resources = [] }) {
  const router = useRouter();
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    if (!sectionRef.current || resources.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const card = cardsRef.current[index];
            if (card) {
              gsap.fromTo(
                card,
                { opacity: 0, y: 30, scale: 0.95 },
                {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: "power2.out",
                }
              );
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => {
      cardsRef.current.forEach((card) => {
        if (card) observer.unobserve(card);
      });
    };
  }, [resources]);

  if (!resources || resources.length === 0) {
    return null;
  }

  const recentResources = resources.slice(0, 3);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <section ref={sectionRef} className={styles.resourcesSection} aria-label="Recent resources">
      <Container>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Latest Articles</h2>
          <Link href="/articles" className={styles.viewAllLink}>
            View All →
          </Link>
        </div>
        <Row className="g-4">
          {recentResources.map((resource, index) => {
            const articleUrl = `/articles/${resource.topic}/${resource.slug}`;
            
            return (
              <Col key={resource.id} md={4}>
                <article
                  ref={(el) => (cardsRef.current[index] = el)}
                  className={styles.resourceCard}
                  onClick={() => router.push(articleUrl)}
                  style={{ cursor: "pointer" }}
                  role="article"
                  aria-label={`View article: ${resource.title}`}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.contentType}>{resource.postType}</span>
                    <time className={styles.date} dateTime={resource.datePublished}>
                      {formatDate(resource.datePublished)}
                    </time>
                  </div>
                  <h3 className={styles.resourceTitle}>{resource.title}</h3>
                  <p className={styles.resourceDescription}>
                    {resource.description.length > 120
                      ? `${resource.description.substring(0, 120)}...`
                      : resource.description}
                  </p>
                  <div className={styles.cardFooter}>
                    <span className={styles.readMore}>Read More →</span>
                    {resource.tags && resource.tags.length > 0 && (
                      <div className={styles.tags}>
                        {resource.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              </Col>
            );
          })}
        </Row>
      </Container>
    </section>
  );
}

