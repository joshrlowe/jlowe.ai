/**
 * TechStackShowcase.jsx
 *
 * SUPERNOVA v2.0 - Technology Showcase
 *
 * Features:
 * - Space Grotesk typography
 * - Refined ember color palette with cool accent
 * - GSAP animations
 */

import { useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Badge } from "@/components/ui";
import { parseJsonField } from "@/lib/utils/jsonUtils";
import { COLOR_VARIANTS } from "@/lib/utils/constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Tech categories with refined colors
const techCategories = {
  "AI/ML": {
    color: "primary",
    techs: [
      "Python",
      "TensorFlow",
      "PyTorch",
      "Scikit-learn",
      "OpenAI",
      "LangChain",
    ],
  },
  Frontend: {
    color: "cool",
    techs: ["React", "Next.js", "TypeScript", "Tailwind", "Vue"],
  },
  Backend: {
    color: "fuchsia",
    techs: ["Node.js", "FastAPI", "PostgreSQL", "Redis", "GraphQL"],
  },
  Cloud: {
    color: "accent",
    techs: ["AWS", "GCP", "Docker", "Kubernetes", "Terraform"],
  },
};

export default function TechStackShowcase({ projects = [] }) {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const iconsRef = useRef([]);

  // Use useMemo instead of useEffect+useState to avoid infinite loops
  // when projects array reference changes but content is the same
  const techStack = useMemo(() => {
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

    // Determine category for each tech
    const categorizedTech = (techName) => {
      for (const [, data] of Object.entries(techCategories)) {
        if (
          data.techs.some((t) => t.toLowerCase() === techName.toLowerCase())
        ) {
          return data.color;
        }
      }
      return "primary";
    };

    return Array.from(techMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        color: categorizedTech(name),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [projects]);

  useEffect(() => {
    if (!sectionRef.current || techStack.length === 0) return;

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

    iconsRef.current.forEach((icon, index) => {
      if (!icon) return;

      gsap.fromTo(
        icon,
        { opacity: 0, scale: 0, rotation: -180 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.7,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          delay: index * 0.07,
        },
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [techStack]);

  if (techStack.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="py-28 relative z-10"
      style={{ background: "rgba(4, 4, 4, 0.6)" }}
      aria-label="Technology stack"
    >
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20" ref={titleRef}>
          {/* Badge */}
          <Badge variant="accent" size="lg" className="mb-8">
            Tech Stack
          </Badge>

          {/* Title - Premium typography */}
          <h2
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
            Technologies I Work With
          </h2>

          <p
            className="text-lg sm:text-xl mx-auto leading-relaxed"
            style={{
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-family-base)",
              maxWidth: "80%",
            }}
          >
            Modern tools and frameworks for building intelligent, scalable
            systems.
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-5">
          {techStack.map((tech, index) => {
            const colors = COLOR_VARIANTS[tech.color];
            return (
              <div
                key={tech.name}
                ref={(el) => (iconsRef.current[index] = el)}
                className="group relative flex flex-col items-center justify-center p-5 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-2"
                style={{
                  background: "rgba(12, 12, 12, 0.85)",
                  border: `1px solid ${colors.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = colors.glow;
                  e.currentTarget.style.borderColor = colors.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = colors.border;
                }}
                role="button"
                tabIndex={0}
                aria-label={`${tech.name} - used in ${tech.count} project${tech.count !== 1 ? "s" : ""}`}
              >
                {/* Icon placeholder */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                >
                  <span
                    className="text-xl font-bold"
                    style={{ fontFamily: "var(--font-family-heading)" }}
                  >
                    {tech.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Name */}
                <div
                  className="text-sm font-medium text-center truncate w-full"
                  style={{
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  {tech.name}
                </div>

                {/* Count */}
                <div
                  className="text-xs mt-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {tech.count} project{tech.count !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
