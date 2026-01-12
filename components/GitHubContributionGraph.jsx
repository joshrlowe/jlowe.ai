/**
 * GitHubContributionGraph.jsx
 *
 * GitHub contribution calendar styled with Supernova theme.
 * Shows coding activity as a visual proof of consistent work.
 *
 * Features:
 * - Custom Supernova color scheme (ember → gold gradient)
 * - Responsive design
 * - Stats display (total contributions, current streak)
 * - GSAP scroll animations
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card, Badge } from "@/components/ui";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Supernova theme color scale (5 levels: none → max activity)
const supernovaTheme = {
  dark: [
    "#161b22", // Level 0: No contributions (GitHub's default dark)
    "#3d1308", // Level 1: Light activity (dark ember)
    "#9d0208", // Level 2: Moderate (crimson)
    "#e85d04", // Level 3: Good activity (ember orange)
    "#ffba08", // Level 4: High activity (gold)
  ],
};

// Stats card component
function StatCard({ label, value, icon, color = "primary" }) {
  const colorMap = {
    primary: "#E85D04",
    accent: "#FAA307",
    cool: "#4CC9F0",
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg"
      style={{
        background: "rgba(12, 12, 12, 0.8)",
        border: `1px solid ${colorMap[color]}25`,
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{
          background: `${colorMap[color]}15`,
          color: colorMap[color],
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-2xl font-bold"
          style={{ color: colorMap[color], fontFamily: "var(--font-family-heading)" }}
        >
          {value}
        </p>
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

function StatsRow({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
      <StatCard
        label="Total Contributions"
        value={stats.total.toLocaleString()}
        color="primary"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />
      <StatCard
        label="Current Streak"
        value={`${stats.currentStreak} days`}
        color="accent"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
            />
          </svg>
        }
      />
      <StatCard
        label="Best Day"
        value={`${stats.bestDay} commits`}
        color="cool"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        }
      />
    </div>
  );
}

// Client-only calendar component wrapper
function CalendarWrapper({ username, onDataLoaded }) {
  const [Calendar, setCalendar] = useState(null);
  const [error, setError] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [apiTestResult, setApiTestResult] = useState(null);
  const contributionsRef = useRef(null);
  const statsCalculatedRef = useRef(false);
  const calculationTimeoutRef = useRef(null);
  const onDataLoadedRef = useRef(onDataLoaded);

  // Keep ref in sync
  useEffect(() => {
    onDataLoadedRef.current = onDataLoaded;
  }, [onDataLoaded]);

  // Direct API test to verify browser can fetch data
  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log("[DEBUG] Testing direct API fetch for username:", username);
        const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
        if (!response.ok) {
          console.error("[DEBUG] API response not OK:", response.status, response.statusText);
          setApiTestResult({ error: `HTTP ${response.status}` });
          return;
        }
        const data = await response.json();
        const daysWithActivity = data.contributions?.filter(d => (d.count || 0) > 0) || [];
        const total = daysWithActivity.reduce((sum, d) => sum + d.count, 0);
        console.log("[DEBUG] Direct API fetch successful!");
        console.log("[DEBUG] Total contributions:", total);
        console.log("[DEBUG] Days with activity:", daysWithActivity.length);
        console.log("[DEBUG] Sample recent day:", daysWithActivity.slice(-5));
        setApiTestResult({ 
          success: true, 
          total, 
          activeDays: daysWithActivity.length,
          rawTotal: data.total 
        });
        
        // If direct API works but calendar doesn't, calculate stats from direct fetch
        if (total > 0 && !statsCalculatedRef.current) {
          console.log("[DEBUG] Using direct API data for stats");
          const sorted = [...(data.contributions || [])].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );
          let currentStreak = 0;
          let bestDay = 0;
          let streakCounting = true;
          sorted.forEach((day) => {
            const count = day.count || 0;
            if (count > bestDay) bestDay = count;
            if (streakCounting && count > 0) {
              currentStreak++;
            } else if (count === 0 && streakCounting) {
              streakCounting = false;
            }
          });
          statsCalculatedRef.current = true;
          onDataLoadedRef.current({ total, bestDay, currentStreak });
        }
      } catch (err) {
        console.error("[DEBUG] Direct API fetch failed:", err);
        setApiTestResult({ error: err.message });
      }
    };
    testAPI();
  }, [username]);

  // Calculate stats function
  const calculateStats = useCallback((contributions) => {
    if (!contributions || contributions.length === 0 || statsCalculatedRef.current) {
      return;
    }

    let total = 0;
    let bestDay = 0;
    let currentStreak = 0;
    let streakCounting = true;

    const sorted = [...contributions].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    sorted.forEach((day) => {
      const count = day.count || 0;
      total += count;
      if (count > bestDay) bestDay = count;
      if (streakCounting && count > 0) {
        currentStreak++;
      } else if (count === 0 && streakCounting) {
        streakCounting = false;
      }
    });

    statsCalculatedRef.current = true;
    onDataLoadedRef.current({ total, bestDay, currentStreak });
  }, []);

  useEffect(() => {
    let mounted = true;

    // Set timeout after 15 seconds
    const timeout = setTimeout(() => {
      if (mounted && !Calendar) {
        console.warn("Calendar loading timeout - taking longer than expected");
        setLoadingTimeout(true);
      }
    }, 15000);

    import("react-github-calendar")
      .then((module) => {
        clearTimeout(timeout);
        if (mounted) {
          // The library exports GitHubCalendar as a named export
          const CalendarComponent = module.GitHubCalendar;
          // Check if it's a valid React component (can be function or forwardRef object)
          if (CalendarComponent && (typeof CalendarComponent === "function" || CalendarComponent.$$typeof)) {
            setCalendar(() => CalendarComponent);
          } else {
            setError(true);
          }
        }
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.error("Failed to load react-github-calendar:", err);
        if (mounted) {
          setError(true);
        }
      });

    return () => {
      clearTimeout(timeout);
      mounted = false;
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, []);

  // transformData should be pure - use refs to avoid setState during render
  const transformData = useCallback((contributions) => {
    if (!contributions || contributions.length === 0) {
      console.log("[DEBUG] transformData received empty contributions");
      return contributions;
    }
    
    // DEBUG: Log raw data structure
    console.log("[DEBUG] transformData received:", contributions.length, "days");
    console.log("[DEBUG] Sample contribution:", JSON.stringify(contributions[0]));
    console.log("[DEBUG] Total count in first 10:", contributions.slice(0, 10).reduce((sum, d) => sum + (d.count || 0), 0));
    
    // Find any days with actual contributions
    const daysWithActivity = contributions.filter(d => (d.count || 0) > 0);
    console.log("[DEBUG] Days with activity:", daysWithActivity.length);
    if (daysWithActivity.length > 0) {
      console.log("[DEBUG] Sample active day:", JSON.stringify(daysWithActivity[0]));
    }
    
    // Store the latest data in ref (no setState during render)
    if (!contributionsRef.current || contributions.length >= contributionsRef.current.length) {
      contributionsRef.current = contributions;
    }
    
    // Schedule stats calculation after render completes
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    
    // Calculate quickly once we have data
    const delay = contributions.length >= 200 ? 100 : 500;
    
    calculationTimeoutRef.current = setTimeout(() => {
      if (contributionsRef.current && !statsCalculatedRef.current) {
        calculateStats(contributionsRef.current);
      }
    }, delay);
    
    // Always return the contributions so the graph displays
    return contributions;
  }, [calculateStats]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-text-secondary)] mb-4">
          Unable to load contribution graph
        </p>
        <a
          href={`https://github.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          style={{
            background: "var(--color-primary)",
            color: "white",
          }}
        >
          View on GitHub
        </a>
      </div>
    );
  }

  if (!Calendar) {
    return (
      <div className="h-32 animate-pulse bg-[var(--color-surface)] rounded-lg flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <span className="mt-3 text-sm text-[var(--color-text-secondary)]">
          Loading contributions...
        </span>
        {loadingTimeout && (
          <span className="mt-2 text-xs text-[var(--color-text-muted)]">
            Taking longer than expected...
          </span>
        )}
        {apiTestResult && (
          <span className="mt-2 text-xs text-[var(--color-text-muted)]">
            API: {apiTestResult.success ? `${apiTestResult.total} contributions found` : apiTestResult.error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-[750px]">
      <Calendar
        username={username}
        theme={supernovaTheme}
        colorScheme="dark"
        fontSize={12}
        blockSize={12}
        blockMargin={4}
        blockRadius={2}
        transformData={transformData}
        labels={{
          totalCount: "{{count}} contributions in the last year",
        }}
        style={{
          color: "var(--color-text-secondary)",
        }}
        throwOnError={false}
        errorMessage="Failed to load contributions. Check browser console."
      />
    </div>
  );
}

export default function GitHubContributionGraph({ username = "joshrlowe" }) {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const [stats, setStats] = useState({ total: 0, bestDay: 0, currentStreak: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!sectionRef.current || !mounted) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

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

  const handleDataLoaded = useCallback((newStats) => {
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
            <Badge variant="cool" size="lg" className="mb-6">
              Coding Activity
            </Badge>

            <h2
              id="github-title"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight"
              style={{
                fontFamily: "var(--font-family-heading)",
                color: "var(--color-text-primary)",
              }}
            >
              GitHub Contributions
            </h2>

            <p
              className="text-lg mx-auto leading-relaxed"
              style={{
                color: "var(--color-text-secondary)",
                maxWidth: "600px",
              }}
            >
              A visual representation of my coding journey. Every square represents a day of building, learning, and shipping.
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
              <CalendarWrapper username={username} onDataLoaded={handleDataLoaded} />
            ) : (
              <div className="h-32 animate-pulse bg-[var(--color-surface)] rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </Card>

          {/* Stats Row */}
          {stats.total > 0 && <StatsRow stats={stats} />}

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
