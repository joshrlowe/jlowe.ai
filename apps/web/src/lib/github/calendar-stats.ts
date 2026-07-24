/**
 * Pure functions for deriving display stats from a list of GitHub
 * contribution-day records. Ported from the v1 site (lib/github/calendar-stats)
 * so the logic stays framework-free and unit-testable.
 *
 * Consumed by the build-time contribution fetch in ./contributions.ts.
 */

export interface ContributionDay {
  date: string;
  count: number;
  level?: number;
}

export interface ContributionStats {
  total: number;
  bestDay: number;
  currentStreak: number;
}

/**
 * Compute the three headline stats.
 *
 * - total: sum of count across every day (zero-count days contribute 0)
 * - bestDay: max count on any single day
 * - currentStreak: number of consecutive days from the most-recent
 *   record backwards with count > 0
 *
 * Sorts a copy of the input descending by date; does not mutate.
 */
export function calculateContributionStats(
  contributions: ContributionDay[],
): ContributionStats {
  if (!contributions || contributions.length === 0) {
    return { total: 0, bestDay: 0, currentStreak: 0 };
  }

  const sorted = [...contributions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  let total = 0;
  let bestDay = 0;
  let currentStreak = 0;
  let streakCounting = true;

  for (const day of sorted) {
    const count = day.count || 0;
    total += count;
    if (count > bestDay) {
      bestDay = count;
    }
    if (streakCounting && count > 0) {
      currentStreak++;
    } else if (count === 0 && streakCounting) {
      streakCounting = false;
    }
  }

  return { total, bestDay, currentStreak };
}
