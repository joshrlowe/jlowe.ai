import { describe, expect, it } from "vitest";

import {
  laneEnvelope,
  LANE_OFFSET,
  overtakeProgress,
  RACE_CARS,
} from "./race-grid";

describe("RACE_CARS", () => {
  it("is a 3-car grid with exactly one leader and one challenger", () => {
    expect(RACE_CARS).toHaveLength(3);
    expect(RACE_CARS.filter((c) => c.role === "leader")).toHaveLength(1);
    expect(RACE_CARS.filter((c) => c.role === "challenger")).toHaveLength(1);
    // distinct liveries so the cars read apart
    expect(new Set(RACE_CARS.map((c) => c.bodyColor)).size).toBe(3);
  });
});

describe("laneEnvelope", () => {
  it("starts and ends a lap on the racing line (seamless loop)", () => {
    expect(laneEnvelope(0)).toBe(0);
    expect(laneEnvelope(1)).toBe(0);
  });

  it("stays within [0,1] and reaches the full lane somewhere mid-lap", () => {
    let max = 0;
    for (let i = 0; i <= 100; i++) {
      const v = laneEnvelope(i / 100);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      max = Math.max(max, v);
    }
    expect(max).toBeCloseTo(1, 2);
  });

  it("scales to a real-world lane width under LANE_OFFSET", () => {
    expect(LANE_OFFSET).toBeGreaterThan(0.5);
    expect(LANE_OFFSET).toBeLessThan(4.5); // stays on the road
  });
});

describe("overtakeProgress", () => {
  it("is zero at the lap boundaries (net-zero — the grid resets)", () => {
    expect(overtakeProgress(0)).toBe(0);
    expect(overtakeProgress(1)).toBe(0);
  });

  it("only ever gains a small positive curve-param, never negative", () => {
    let max = 0;
    for (let i = 0; i <= 100; i++) {
      const v = overtakeProgress(i / 100);
      expect(v).toBeGreaterThanOrEqual(0);
      max = Math.max(max, v);
    }
    expect(max).toBeGreaterThan(0);
    expect(max).toBeLessThanOrEqual(0.05 + 1e-9); // <= GAIN_T
  });
});
