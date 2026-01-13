/**
 * ProjectCard.jsx
 *
 * Space-themed project card with:
 * - Hover effects and glow
 * - GSAP entrance animation
 * - Tech stack badges
 */

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "next/router";
import Image from "next/image";
import StatusBadge from "./StatusBadge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ProjectCard({ project, index = 0 }) {
  const router = useRouter();
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
        delay: (index % 3) * 0.1,
      },
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [index]);

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
  const techStack = parseJsonField(project.techStack, []);
  const _tags = parseJsonField(project.tags, []);

  let thumbnail = images.length > 0 ? images[0] : null;
  if (thumbnail && typeof thumbnail === "object") {
    thumbnail = thumbnail.url || thumbnail.src || thumbnail;
  }
  const thumbnailUrl = typeof thumbnail === "string" ? thumbnail : null;
  const projectUrl = `/projects/${project.slug || project.id}`;

  const handleClick = () => {
    router.push(projectUrl);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      ref={cardRef}
      className="group relative overflow-hidden rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] transition-all duration-500 hover:border-[var(--color-border-glow)] hover:shadow-lg cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="article"
      tabIndex={0}
      aria-label={`View project: ${project.title}`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-[var(--color-bg-darker)]">
        {thumbnailUrl ? (
          <>
            <Image
              src={thumbnailUrl}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
              unoptimized={
                thumbnailUrl.startsWith("data:") ||
                thumbnailUrl.startsWith("blob:")
              }
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-card)] via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-card)] to-[var(--color-bg-darker)]">
            <span className="text-5xl font-bold text-[var(--color-primary)] opacity-20 font-heading">
              {project.title?.charAt(0) || "P"}
            </span>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-4 left-4">
          <StatusBadge status={project.status} />
        </div>

        {/* Featured indicator */}
        {project.featured && (
          <div className="absolute top-4 right-4">
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-[var(--color-primary)] text-[var(--color-bg-dark)]">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2 font-heading group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
          {project.title}
        </h3>

        {project.shortDescription && (
          <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-2">
            {project.shortDescription}
          </p>
        )}

        {/* Tech stack */}
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {techStack.slice(0, 3).map((tech, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded-md bg-[var(--color-bg-darker)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
              >
                {typeof tech === "string" ? tech : tech.name || tech}
              </span>
            ))}
            {techStack.length > 3 && (
              <span className="px-2 py-1 text-xs text-[var(--color-text-muted)]">
                +{techStack.length - 3}
              </span>
            )}
          </div>
        )}

        {/* View link */}
        <div className="flex items-center gap-2 text-[var(--color-primary)] text-sm font-medium">
          <span>View Details</span>
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      </div>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at 50% 50%, rgba(0, 212, 255, 0.05), transparent 40%)`,
        }}
      />
    </article>
  );
}
