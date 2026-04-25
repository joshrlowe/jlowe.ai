/**
 * FeaturedProjects.jsx
 *
 * SUPERNOVA v2.0 - Featured Projects
 *
 * Features:
 * - Space Grotesk typography
 * - Refined ember color palette with cool accent
 * - 3D tilt cards with glow effects
 * - GSAP scroll animations
 */

import { useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter } from "next/router";
import Image from "next/image";
import { Badge, Button } from "@/components/ui";
import { parseJsonField } from "@/lib/utils/jsonUtils";
import { FEATURED_ACCENT_COLORS } from "@/lib/utils/constants";
import { getPrefersReducedMotion } from "@/lib/hooks";

export default function FeaturedProjects({ projects = [] }) {
  const router = useRouter();
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!sectionRef.current || projects.length === 0) return;

    if (getPrefersReducedMotion()) {
      // Ensure elements are visible with reduced motion
      if (titleRef.current) {
        gsap.set(titleRef.current, { opacity: 1, y: 0 });
      }
      cardsRef.current.forEach((card) => {
        if (card) gsap.set(card, { opacity: 1, y: 0, scale: 1 });
      });
      return;
    }

    const triggers = [];

    // Helper to check if element is in viewport
    const isInViewport = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    };

    // Animate title
    if (titleRef.current) {
      if (isInViewport(titleRef.current)) {
        // Already in viewport - animate immediately
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
        );
      } else {
        // Use ScrollTrigger for below-viewport elements
        const trigger = ScrollTrigger.create({
          trigger: titleRef.current,
          start: "top 85%",
          onEnter: () => {
            gsap.fromTo(
              titleRef.current,
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" },
            );
          },
          once: true,
        });
        triggers.push(trigger);
      }
    }

    cardsRef.current.forEach((card, index) => {
      if (!card) return;

      if (isInViewport(card)) {
        // Already in viewport - animate immediately with stagger
        gsap.fromTo(
          card,
          { opacity: 0, y: 40, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power2.out",
            delay: index * 0.12,
          },
        );
      } else {
        // Use ScrollTrigger for below-viewport elements
        const trigger = ScrollTrigger.create({
          trigger: card,
          start: "top 85%",
          onEnter: () => {
            gsap.fromTo(
              card,
              { opacity: 0, y: 70, scale: 0.92 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: "power2.out",
                delay: index * 0.15,
              },
            );
          },
          once: true,
        });
        triggers.push(trigger);
      }
    });

    return () => {
      triggers.forEach((trigger) => trigger.kill());
    };
  }, [projects]);

  // 3D tilt effect
  const handleMouseMove = useCallback((e, card) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateZ(8px)`;
  }, []);

  const handleMouseLeave = useCallback((card) => {
    card.style.transform = "";
  }, []);

  if (!projects || projects.length === 0) return null;

  // Show featured projects first, fall back to most recent projects
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 4);
  const displayProjects = featuredProjects.length > 0 
    ? featuredProjects 
    : projects.slice(0, 4);

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="py-32 relative z-10"
      aria-labelledby="projects-title"
    >
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20" ref={titleRef}>
          {/* Badge */}
          <Badge variant="primary" size="lg" className="mb-8">
            Portfolio
          </Badge>

          {/* Title - Premium typography */}
          <h2
            id="projects-title"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 tracking-tight"
            style={{
              fontFamily: "var(--font-family-heading)",
              background:
                "linear-gradient(135deg, #FAFAFA 0%, #E85D04 60%, #9D0208 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Featured Projects
          </h2>

          <p
            className="text-lg sm:text-xl mx-auto leading-relaxed"
            style={{
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-family-base)",
              maxWidth: "80%",
            }}
          >
            A selection of AI and engineering projects I've built for clients
            and personal exploration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayProjects.map((project, index) => {
            const images = parseJsonField(project.images, []);
            const techStack = parseJsonField(project.techStack, []);
            let thumbnail = images.length > 0 ? images[0] : null;
            if (thumbnail && typeof thumbnail === "object") {
              thumbnail = thumbnail.url || thumbnail.src || thumbnail;
            }
            const thumbnailUrl =
              typeof thumbnail === "string" ? thumbnail : null;
            const projectUrl = `/projects#${project.slug || project.id}`;

            const accent = FEATURED_ACCENT_COLORS[index % FEATURED_ACCENT_COLORS.length];

            return (
              <article
                key={project.id}
                ref={(el) => (cardsRef.current[index] = el)}
                className="group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer"
                style={{
                  background: "rgba(12, 12, 12, 0.92)",
                  border: "1px solid rgba(232, 93, 4, 0.12)",
                  transformStyle: "preserve-3d",
                }}
                onClick={() => router.push(projectUrl)}
                onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
                onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
                role="article"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && router.push(projectUrl)}
                aria-label={`View project: ${project.title}`}
              >
                {/* Image */}
                <div className="relative h-52 sm:h-60 overflow-hidden bg-black">
                  {thumbnailUrl ? (
                    <>
                      <Image
                        src={thumbnailUrl}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        loading="lazy"
                        unoptimized={
                          thumbnailUrl.startsWith("data:") ||
                          thumbnailUrl.startsWith("blob:")
                        }
                      />
                      {/* Gradient overlay */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(12, 12, 12, 1) 0%, rgba(12, 12, 12, 0.4) 50%, transparent 100%)",
                        }}
                      />
                    </>
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, #0c0c0c 0%, #181818 100%)",
                      }}
                    >
                      <span
                        className="text-7xl font-bold opacity-25"
                        style={{
                          color: accent.text,
                          fontFamily: "var(--font-family-heading)",
                        }}
                      >
                        {project.title.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Featured badge */}
                  <div className="absolute top-4 left-4">
                    <Badge
                      variant="primary"
                      size="sm"
                      icon={
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      }
                    >
                      Featured
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-7">
                  <h3
                    className="text-xl font-semibold mb-3 tracking-tight"
                    style={{
                      color: "var(--color-text-primary)",
                      fontFamily: "var(--font-family-heading)",
                    }}
                  >
                    {project.title}
                  </h3>

                  {project.shortDescription && (
                    <p
                      className="text-sm mb-5 line-clamp-2 leading-relaxed"
                      style={{
                        color: "var(--color-text-secondary)",
                        fontFamily: "var(--font-family-base)",
                      }}
                    >
                      {project.shortDescription}
                    </p>
                  )}

                  {/* Tech stack */}
                  {techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {techStack.slice(0, 4).map((tech, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 text-xs rounded-md font-medium"
                          style={{
                            background: "rgba(232, 93, 4, 0.08)",
                            color: "var(--color-text-muted)",
                            border: "1px solid rgba(232, 93, 4, 0.15)",
                          }}
                        >
                          {typeof tech === "string" ? tech : tech.name || tech}
                        </span>
                      ))}
                      {techStack.length > 4 && (
                        <span
                          className="px-2 py-1 text-xs font-medium"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          +{techStack.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* View link */}
                  <div
                    className="flex items-center gap-2 text-sm font-semibold"
                    style={{ color: accent.text }}
                  >
                    <span>View Project</span>
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

                {/* Glow effect on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{
                    boxShadow: accent.glow,
                  }}
                />
              </article>
            );
          })}
        </div>

        {/* View all link */}
        <div className="text-center mt-16">
          <Button
            href="/projects"
            variant="secondary"
            size="lg"
            icon={
              <svg
                className="w-5 h-5"
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
            }
          >
            View All Projects
          </Button>
        </div>
      </div>
    </section>
  );
}
