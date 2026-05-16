"use client";

/**
 * Lazy wrapper around `react-github-calendar`.
 *
 * Two reasons this is bespoke (not a generic <LazyMount> hook):
 *
 * 1. The `react-github-calendar` import path returns a CommonJS-style
 *    object whose React component is exported as `module.GitHubCalendar`.
 *    We validate it's a function or has `$$typeof` (forwardRef) before
 *    rendering — that runtime check doesn't generalize.
 *
 * 2. We pair the lazy import with a parallel direct fetch from
 *    github-contributions-api.jogruber.de so stats display even when
 *    the calendar bundle is blocked or slow. The two paths share a
 *    statsCalculatedRef guard so whichever resolves first wins.
 *
 * If a third caller appears for "lazy with timeout + parallel fallback,"
 * promote to a hook then. Single-use case = inline component.
 */

import { ComponentType, useCallback, useEffect, useRef, useState } from "react";
import {
  calculateContributionStats,
  type ContributionDay,
  type ContributionStats,
} from "@/lib/github/calendar-stats";

type CalendarComponent = ComponentType<any>;

const SUPERNOVA_COLORS = [
  "#161b22", // Level 0: No contributions (GitHub's default dark)
  "#3d1308", // Level 1: Light activity (dark ember)
  "#9d0208", // Level 2: Moderate (crimson)
  "#e85d04", // Level 3: Good activity (ember orange)
  "#ffba08", // Level 4: High activity (gold)
];

const supernovaTheme = { dark: SUPERNOVA_COLORS };

const LOAD_TIMEOUT_MS = 15_000;

function MobileColorLegend() {
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <span className="text-xs text-[var(--color-text-muted)]">Less</span>
      <div className="flex gap-1">
        {SUPERNOVA_COLORS.map((color, index) => (
          <div key={index} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
        ))}
      </div>
      <span className="text-xs text-[var(--color-text-muted)]">More</span>
    </div>
  );
}

interface LazyCalendarProps {
  username: string;
  onDataLoaded: (stats: ContributionStats) => void;
  isMobile: boolean;
}

export default function LazyCalendar({ username, onDataLoaded, isMobile }: LazyCalendarProps) {
  const [Calendar, setCalendar] = useState<CalendarComponent | null>(null);
  const [error, setError] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const contributionsRef = useRef<ContributionDay[] | null>(null);
  const statsCalculatedRef = useRef(false);
  const calculationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDataLoadedRef = useRef(onDataLoaded);

  useEffect(() => {
    onDataLoadedRef.current = onDataLoaded;
  }, [onDataLoaded]);

  // Direct API fallback: calculate stats from the raw API even if the
  // react-github-calendar bundle is blocked or slow. The calendar's
  // transformData path still wins when it fires first thanks to the
  // statsCalculatedRef guard.
  useEffect(() => {
    const fetchAndCalc = async () => {
      try {
        const response = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${username}?y=last`
        );
        if (!response.ok) {
          console.error(
            "[GitHubContributionGraph] fallback API not OK:",
            response.status,
            response.statusText
          );
          return;
        }
        const data = (await response.json()) as {
          contributions?: ContributionDay[];
          total?: number;
        };
        const daysWithActivity = data.contributions?.filter((d) => (d.count || 0) > 0) || [];
        const total = daysWithActivity.reduce((sum, d) => sum + d.count, 0);

        if (total > 0 && !statsCalculatedRef.current) {
          statsCalculatedRef.current = true;
          onDataLoadedRef.current(calculateContributionStats(data.contributions || []));
        }
      } catch {
        // Silent — the calendar's own loader will surface its error UI.
      }
    };
    fetchAndCalc();
  }, [username]);

  const calculateStats = useCallback((contributions: ContributionDay[]) => {
    if (!contributions || contributions.length === 0 || statsCalculatedRef.current) {
      return;
    }
    statsCalculatedRef.current = true;
    onDataLoadedRef.current(calculateContributionStats(contributions));
  }, []);

  // Load the calendar bundle with a 15s timeout for the loading affordance.
  useEffect(() => {
    let mounted = true;

    const timeout = setTimeout(() => {
      if (mounted && !Calendar) {
        setLoadingTimeout(true);
      }
    }, LOAD_TIMEOUT_MS);

    import("react-github-calendar")
      .then((mod: any) => {
        clearTimeout(timeout);
        if (!mounted) return;
        const Component = mod.GitHubCalendar;
        if (Component && (typeof Component === "function" || Component.$$typeof)) {
          setCalendar(() => Component);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        clearTimeout(timeout);
        if (mounted) {
          setError(true);
        }
      });

    return () => {
      clearTimeout(timeout);
      mounted = false;
    };
    // Calendar is intentionally only used in the timeout-guard check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, []);

  // transformData is pure — uses refs to defer setState past render.
  const transformData = useCallback(
    (contributions: ContributionDay[]): ContributionDay[] => {
      if (!contributions || contributions.length === 0) {
        return contributions;
      }

      if (!contributionsRef.current || contributions.length >= contributionsRef.current.length) {
        contributionsRef.current = contributions;
      }

      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
      const delay = contributions.length >= 200 ? 100 : 500;
      calculationTimeoutRef.current = setTimeout(() => {
        if (contributionsRef.current && !statsCalculatedRef.current) {
          calculateStats(contributionsRef.current);
        }
      }, delay);

      // Mobile: 14 full weeks (98 days) anchored to the leftmost full week.
      if (isMobile) {
        const sorted = [...contributions].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        if (sorted.length === 0) return contributions;

        const lastDate = new Date(sorted[sorted.length - 1].date);
        const dayOfWeek = lastDate.getDay();
        const daysUntilSaturday = 6 - dayOfWeek;
        const endOfWeek = new Date(lastDate);
        endOfWeek.setDate(lastDate.getDate() + daysUntilSaturday);

        const startDate = new Date(endOfWeek);
        startDate.setDate(endOfWeek.getDate() - 97);
        const startDayOfWeek = startDate.getDay();
        if (startDayOfWeek !== 0) {
          startDate.setDate(startDate.getDate() - startDayOfWeek);
        }

        const startTime = startDate.getTime();
        const endTime = endOfWeek.getTime();
        return sorted.filter((c) => {
          const t = new Date(c.date).getTime();
          return t >= startTime && t <= endTime;
        });
      }

      return contributions;
    },
    [calculateStats, isMobile]
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-text-secondary)] mb-4">Unable to load contribution graph</p>
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
      </div>
    );
  }

  return (
    <div className={isMobile ? "flex flex-col items-center" : "min-w-[750px]"}>
      <Calendar
        username={username}
        theme={supernovaTheme}
        colorScheme="dark"
        fontSize={isMobile ? 10 : 12}
        blockSize={isMobile ? 14 : 12}
        blockMargin={isMobile ? 3 : 4}
        blockRadius={2}
        transformData={transformData}
        showColorLegend={!isMobile}
        labels={{
          totalCount: isMobile
            ? "{{count}} contributions (last 14 weeks)"
            : "{{count}} contributions in the last year",
        }}
        style={{
          color: "var(--color-text-secondary)",
        }}
        throwOnError={false}
        errorMessage="Failed to load contributions. Check browser console."
      />
      {isMobile && <MobileColorLegend />}
    </div>
  );
}
