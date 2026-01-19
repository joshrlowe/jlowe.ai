/**
 * QuickStats.jsx
 *
 * SUPERNOVA v2.0 - Statistics Section
 *
 * Features:
 * - Space Grotesk typography
 * - Refined ember color palette with cool accent
 * - Counting animations
 * - GSAP scroll triggers
 */

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { parseJsonField } from "@/lib/utils/jsonUtils";
import { COLOR_VARIANTS } from "@/lib/utils/constants";
import { getPrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function QuickStats({ projects = [], aboutData: _aboutData = null }) {
  const sectionRef = useRef(null);
  const [countersStarted, setCountersStarted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculateStats = () => {
    const safeProjects = projects || [];
    const publishedProjects = safeProjects.filter((p) => p.status === "Published");
    const techStack = publishedProjects.reduce((acc, project) => {
      const tech = parseJsonField(project.techStack, []);
      return [...acc, ...tech];
    }, []);
    const uniqueTechs = [...new Set(techStack)];

    let yearsExperience = 0;
    if (mounted && publishedProjects.length > 0) {
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
      clients: Math.max(publishedProjects.length - 2, 5),
    };
  };

  const stats = calculateStats();
  const [displayedStats, setDisplayedStats] = useState({
    projects: 0,
    technologies: 0,
    experience: 0,
    clients: 0,
  });

  useEffect(() => {
    if (!sectionRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 80%",
      onEnter: () => {
        if (!countersStarted) {
          setCountersStarted(true);
        }
      },
    });

    return () => trigger.kill();
  }, [countersStarted]);

  useEffect(() => {
    if (!countersStarted) return;

    const prefersReducedMotion = getPrefersReducedMotion();

    if (prefersReducedMotion) {
      setDisplayedStats({
        projects: stats.projects,
        technologies: stats.technologies,
        experience: stats.experience,
        clients: stats.clients,
      });
      return;
    }

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
            clients: Math.floor(stats.clients * progress),
          });
        },
      },
    );
  }, [
    countersStarted,
    stats.projects,
    stats.technologies,
    stats.experience,
    stats.clients,
  ]);

  // Use centralized color variants
  const colorMap = COLOR_VARIANTS;

  const statItems = [
    {
      value: displayedStats.projects,
      label: "Projects Delivered",
      suffix: "+",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      color: "primary",
    },
    {
      value: displayedStats.technologies,
      label: "Technologies",
      suffix: "+",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
      color: "accent",
    },
    {
      value: displayedStats.experience,
      label: "Years Experience",
      suffix: "+",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "cool",
    },
    {
      value: displayedStats.clients,
      label: "Happy Clients",
      suffix: "+",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: "fuchsia",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-28 relative z-10"
      aria-label="Statistics"
    >
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-7">
          {statItems.map((stat, index) => {
            const colors = colorMap[stat.color];
            return (
              <div
                key={index}
                className="group text-center p-7 rounded-xl transition-all duration-300 hover:-translate-y-2"
                style={{
                  background: "rgba(12, 12, 12, 0.85)",
                  border: `1px solid ${colors.text}25`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = colors.glow;
                  e.currentTarget.style.borderColor = colors.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = `${colors.text}25`;
                }}
                role="region"
                aria-label={stat.label}
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 mx-auto mb-5 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{
                    background: colors.bg,
                    color: colors.text,
                  }}
                >
                  {stat.icon}
                </div>

                {/* Number with glow */}
                <div
                  className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight"
                  style={{
                    fontFamily: "var(--font-family-heading)",
                    color: colors.text,
                    textShadow: `0 0 25px ${colors.text}50`,
                  }}
                  aria-live="polite"
                >
                  {stat.value}
                  {stat.suffix}
                </div>

                {/* Label */}
                <div
                  className="text-sm font-medium"
                  style={{
                    color: "var(--color-text-secondary)",
                    fontFamily: "var(--font-family-base)",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
