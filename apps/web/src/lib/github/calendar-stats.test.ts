import { describe, expect, it } from "vitest";
import {
  calculateContributionStats,
  type ContributionDay,
} from "@/lib/github/calendar-stats";

const day = (date: string, count: number, level = 0): ContributionDay => ({
  date,
  count,
  level,
});

describe("calculateContributionStats", () => {
  it("returns zeros for empty input", () => {
    expect(calculateContributionStats([])).toEqual({
      total: 0,
      bestDay: 0,
      currentStreak: 0,
    });
  });

  it("sums total across every day including zero-count days", () => {
    const stats = calculateContributionStats([
      day("2026-05-01", 3),
      day("2026-05-02", 0),
      day("2026-05-03", 5),
    ]);
    expect(stats.total).toBe(8);
  });

  it("picks the maximum single-day count for bestDay", () => {
    const stats = calculateContributionStats([
      day("2026-05-01", 1),
      day("2026-05-02", 9),
      day("2026-05-03", 4),
    ]);
    expect(stats.bestDay).toBe(9);
  });

  it("counts the current streak from the most recent date backwards", () => {
    const stats = calculateContributionStats([
      day("2026-05-01", 1),
      day("2026-05-02", 1),
      day("2026-05-03", 1),
    ]);
    expect(stats.currentStreak).toBe(3);
  });

  it("ends the streak when the most recent gap appears", () => {
    const stats = calculateContributionStats([
      day("2026-05-01", 5),
      day("2026-05-02", 5),
      day("2026-05-03", 0),
    ]);
    expect(stats.currentStreak).toBe(0);
  });

  it("does not mutate the input array", () => {
    const input: ContributionDay[] = [
      day("2026-05-02", 1),
      day("2026-05-01", 2),
    ];
    const before = [...input];
    calculateContributionStats(input);
    expect(input).toEqual(before);
  });
});
