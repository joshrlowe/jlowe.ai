/**
 * RecentResources.jsx
 *
 * SUPERNOVA v2.0 - Recent Articles
 *
 * Features:
 * - Space Grotesk typography
 * - Refined ember color palette with cool accent
 * - GSAP scroll animations
 * - Clean grid layout
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { Badge, Button } from "@/components/ui";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function RecentResources({ resources = [] }) {
  const router = useRouter();
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!sectionRef.current || resources.length === 0) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    // Animate title
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );
    }

    cardsRef.current.forEach((card, index) => {
      if (!card) return;

      gsap.fromTo(
        card,
        { opacity: 0, y: 50, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          delay: index * 0.12,
        },
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [resources]);

  if (!resources || resources.length === 0) return null;

  const recentResources = resources.slice(0, 3);

  const formatDate = (dateString) => {
    if (!dateString || !mounted) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Refined color map
  const colorMap = {
    primary: {
      bg: "rgba(232, 93, 4, 0.12)",
      border: "rgba(232, 93, 4, 0.25)",
      text: "#E85D04",
    },
    cool: {
      bg: "rgba(76, 201, 240, 0.12)",
      border: "rgba(76, 201, 240, 0.25)",
      text: "#4CC9F0",
    },
    fuchsia: {
      bg: "rgba(247, 37, 133, 0.12)",
      border: "rgba(247, 37, 133, 0.25)",
      text: "#F72585",
    },
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "tutorial":
        return "primary";
      case "article":
        return "cool";
      case "guide":
        return "fuchsia";
      default:
        return "primary";
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py-28 relative z-10"
      aria-label="Recent articles"
    >
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-16" ref={titleRef}>
          <div>
            {/* Badge */}
            <Badge variant="primary" size="lg" className="mb-8">
              Blog
            </Badge>

            {/* Title - Premium typography */}
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
              style={{
                fontFamily: "var(--font-family-heading)",
                background:
                  "linear-gradient(135deg, #FAFAFA 0%, #E85D04 60%, #9D0208 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Latest Articles
            </h2>
          </div>
          <Link
            href="/articles"
            className="hidden sm:flex items-center gap-2 font-semibold transition-all hover:gap-3"
            style={{
              color: "#E85D04",
              fontFamily: "var(--font-family-base)",
            }}
          >
            <span>View All</span>
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
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {recentResources.map((resource, index) => {
            const articleUrl = `/articles/${resource.topic}/${resource.slug}`;
            const typeColor = getTypeColor(resource.postType);
            const colors = colorMap[typeColor];

            return (
              <article
                key={resource.id}
                ref={(el) => (cardsRef.current[index] = el)}
                className="group relative overflow-hidden rounded-xl p-7 cursor-pointer transition-all duration-300 hover:-translate-y-2"
                style={{
                  background: "rgba(12, 12, 12, 0.92)",
                  border: `1px solid ${colors.border}`,
                }}
                onClick={() => router.push(articleUrl)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 35px ${colors.text}30`;
                  e.currentTarget.style.borderColor = colors.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = colors.border;
                }}
                role="article"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && router.push(articleUrl)}
                aria-label={`Read article: ${resource.title}`}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(90deg, ${colors.text}, transparent)`,
                  }}
                />

                {/* Meta */}
                <div className="flex items-center gap-3 mb-5">
                  <Badge variant={typeColor} size="sm">
                    {resource.postType}
                  </Badge>
                  <time
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                    dateTime={resource.datePublished}
                  >
                    {formatDate(resource.datePublished)}
                  </time>
                </div>

                {/* Title */}
                <h3
                  className="text-xl font-semibold mb-4 line-clamp-2 tracking-tight transition-colors"
                  style={{
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-family-heading)",
                  }}
                >
                  {resource.title}
                </h3>

                {/* Description */}
                <p
                  className="text-sm mb-5 line-clamp-3 flex-grow leading-relaxed"
                  style={{
                    color: "var(--color-text-secondary)",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  {resource.description}
                </p>

                {/* Footer */}
                <div
                  className="flex items-center justify-between pt-5"
                  style={{ borderTop: `1px solid ${colors.border}` }}
                >
                  <span
                    className="flex items-center gap-2 text-sm font-semibold"
                    style={{ color: colors.text }}
                  >
                    <span>Read More</span>
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
                  </span>

                  {resource.readingTime && (
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {resource.readingTime} min read
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Mobile view all link */}
        <div className="sm:hidden text-center mt-12">
          <Button href="/articles" variant="secondary" size="lg">
            View All Articles
          </Button>
        </div>
      </div>
    </section>
  );
}
