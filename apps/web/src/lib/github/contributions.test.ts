import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getContributions,
  mapCalendarToData,
  placeholderContributions,
} from "@/lib/github/contributions";

describe("mapCalendarToData", () => {
  it("maps GitHub contribution levels to the 0–4 scale and computes stats", () => {
    const data = mapCalendarToData([
      {
        contributionDays: [
          { date: "2026-05-01", contributionCount: 0, contributionLevel: "NONE" },
          {
            date: "2026-05-02",
            contributionCount: 4,
            contributionLevel: "SECOND_QUARTILE",
          },
        ],
      },
      {
        contributionDays: [
          {
            date: "2026-05-03",
            contributionCount: 9,
            contributionLevel: "FOURTH_QUARTILE",
          },
        ],
      },
    ]);

    expect(data.source).toBe("github");
    expect(data.weeks).toEqual([[0, 2], [4]]);
    expect(data.days).toHaveLength(3);
    expect(data.stats.total).toBe(13);
    expect(data.stats.bestDay).toBe(9);
    // Most recent days 05-03 (9) and 05-02 (4) are active, 05-01 (0) breaks it → streak 2.
    expect(data.stats.currentStreak).toBe(2);
  });

  it("defaults unknown levels to 0", () => {
    const data = mapCalendarToData([
      {
        contributionDays: [
          { date: "2026-05-01", contributionCount: 1, contributionLevel: "MYSTERY" },
        ],
      },
    ]);
    expect(data.weeks).toEqual([[0]]);
  });
});

describe("placeholderContributions", () => {
  it("returns the seeded grid with a placeholder marker and zeroed stats", () => {
    const data = placeholderContributions();
    expect(data.source).toBe("placeholder");
    expect(data.weeks).toHaveLength(52);
    expect(data.days).toEqual([]);
    expect(data.stats).toEqual({ total: 0, bestDay: 0, currentStreak: 0 });
  });
});

describe("getContributions", () => {
  const originalToken = process.env.GITHUB_TOKEN;

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env.GITHUB_TOKEN = originalToken;
    vi.restoreAllMocks();
  });

  it("falls back to the placeholder (never throws) when GITHUB_TOKEN is absent", async () => {
    delete process.env.GITHUB_TOKEN;
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const data = await getContributions();

    expect(data.source).toBe("placeholder");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("falls back to the placeholder when the request fails", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 }),
    );

    const data = await getContributions();

    expect(data.source).toBe("placeholder");
  });
});
