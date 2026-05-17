"use client";

/**
 * GitHubContributionGraph
 *
 * GitHub contribution calendar styled with Supernova theme. Composes
 * the lazy calendar in components/GitHub/LazyCalendar.tsx and the
 * 3-card stats row in components/GitHub/StatsCards.tsx, with GSAP
 * scroll animation on mount.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, registerGsapPlugins } from "@/lib/animations/gsap";
import { Card } from "@/components/ui";
import { getPrefersReducedMotion, useIsMobile } from "@/lib/hooks";
import LazyCalendar from "@/components/GitHub/LazyCalendar";
import StatsCards from "@/components/GitHub/StatsCards";
import type { ContributionStats } from "@/lib/github/calendar-stats";

interface GitHubContributionGraphProps {
  username?: string;
  title?: string;
  description?: string;
}

export default function GitHubContributionGraph({
  username = "joshrlowe",
  title = "GitHub Contributions",
  description = "A visual representation of my coding journey. Every square represents a day of building, learning, and shipping.",
}: GitHubContributionGraphProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [stats, setStats] = useState<ContributionStats>({
    total: 0,
    bestDay: 0,
    currentStreak: 0,
  });
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    registerGsapPlugins();

    if (!sectionRef.current || !mounted) return;
    if (getPrefersReducedMotion()) return;

    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [mounted]);

  const handleDataLoaded = useCallback((newStats: ContributionStats) => {
    setStats(newStats);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="github-activity"
      className="py-24 relative z-10"
      aria-labelledby="github-title"
    >
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={contentRef}>
          {/* Header */}
          <div className="text-center mb-12">
            <h2
              id="github-title"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight"
              style={{
                fontFamily: "var(--font-family-heading)",
                color: "var(--color-text-primary)",
              }}
            >
              {title}
            </h2>

            <p
              className="text-lg mx-auto leading-relaxed"
              style={{
                color: "var(--color-text-secondary)",
                maxWidth: "600px",
              }}
            >
              {description}
            </p>
          </div>

          {/* Contribution Graph */}
          <Card
            variant="default"
            className="p-6 sm:p-8 mb-8 overflow-x-auto"
            style={{
              background: "rgba(8, 8, 8, 0.9)",
              backdropFilter: "blur(10px)",
            }}
          >
            {mounted ? (
              <LazyCalendar
                username={username}
                onDataLoaded={handleDataLoaded}
                isMobile={isMobile}
              />
            ) : (
              <div className="h-32 animate-pulse bg-[var(--color-surface)] rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </Card>

          {/* Stats Row */}
          {stats.total > 0 && <StatsCards stats={stats} />}

          {/* View on GitHub link */}
          <div className="text-center mt-8">
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--color-primary)]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              View full profile on GitHub
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
