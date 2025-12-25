import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "@/styles/ProjectCard.module.css";
import StatusBadge from "./StatusBadge";

export default function ProjectCard({ project, index = 0 }) {
  const router = useRouter();
  const cardRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const images = parseJsonField(project.images, []);
  const tags = parseJsonField(project.tags, []);
  const links = parseJsonField(project.links, {});
  let thumbnail = images.length > 0 ? images[0] : null;
  if (thumbnail && typeof thumbnail === "object") {
    thumbnail = thumbnail.url || thumbnail.src || thumbnail;
  }
  const thumbnailUrl = typeof thumbnail === "string" ? thumbnail : null;

  const projectUrl = project.slug ? `/projects/${project.slug}` : `/projects/${project.id}`;

  const handleCardClick = (e) => {
    // Don't navigate if clicking on external links or buttons
    if (e.target.closest('[data-external-link]')) {
      return;
    }
    if (mounted && router) {
      router.push(projectUrl);
    }
  };

  const handleExternalLink = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <article
      ref={cardRef}
      className={styles.projectCard}
      data-index={index}
      role="article"
      aria-label={`Project: ${project.title}`}
    >
      <div 
        onClick={handleCardClick} 
        className={styles.cardLink}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && mounted && router) {
            e.preventDefault();
            router.push(projectUrl);
          }
        }}
      >
        {thumbnailUrl ? (
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
            <div className={styles.imageOverlay}>
              <StatusBadge status={project.status} />
            </div>
          </div>
        ) : (
          <div className={styles.imageContainer} style={{ background: "var(--color-bg-dark)" }}>
            <div className={styles.placeholderImage}>
              <span>{project.title.charAt(0)}</span>
            </div>
            <div className={styles.imageOverlay}>
              <StatusBadge status={project.status} />
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

          <div className={styles.cardMeta}>
            {project.startDate && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Started:</span>
                <span className={styles.metaValue}>
                  {new Date(project.startDate).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                </span>
              </div>
            )}
            {project.releaseDate && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Released:</span>
                <span className={styles.metaValue}>
                  {new Date(project.releaseDate).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                </span>
              </div>
            )}
          </div>

          {tags.length > 0 && (
            <div className={styles.tags}>
              {tags.slice(0, 3).map((tag, i) => (
                <span key={i} className={styles.tag}>
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className={styles.moreTags}>+{tags.length - 3}</span>
              )}
            </div>
          )}

          <div className={styles.cardFooter}>
            <div className={styles.links}>
              {links.github && (
                <button
                  type="button"
                  data-external-link
                  className={styles.linkIcon}
                  onClick={(e) => handleExternalLink(e, links.github)}
                  aria-label={`View ${project.title} on GitHub`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </button>
              )}
              {links.live && (
                <button
                  type="button"
                  data-external-link
                  className={styles.linkIcon}
                  onClick={(e) => handleExternalLink(e, links.live)}
                  aria-label={`Visit live ${project.title} site`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                </button>
              )}
            </div>
            <span className={styles.viewProject}>View Project →</span>
          </div>
        </div>
      </div>
    </article>
  );
}

