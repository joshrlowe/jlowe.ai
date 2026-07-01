import { describe, expect, it } from "vitest";

import { CHALLENGER_LANE, passSwap, RACE_CARS } from "./race-grid";

describe("RACE_CARS", () => {
  it("is a five-car field with exactly one leader and one challenger", () => {
    expect(RACE_CARS).toHaveLength(5);
    expect(RACE_CARS.filter((c) => c.role === "leader")).toHaveLength(1);
    expect(RACE_CARS.filter((c) => c.role === "challenger")).toHaveLength(1);
    // distinct liveries so the cars read apart
    expect(new Set(RACE_CARS.map((c) => c.bodyColor)).size).toBe(5);
  });

  it("runs the leader and challenger as a shared-slot battle pair", () => {
    const leader = RACE_CARS.find((c) => c.role === "leader");
    const challenger = RACE_CARS.find((c) => c.role === "challenger");
    expect(leader?.tOffset).toBeCloseTo(challenger?.tOffset ?? -1, 6);
  });
});

describe("CHALLENGER_LANE", () => {
  it("is a close camera-side lane that stays on the road", () => {
    expect(CHALLENGER_LANE).toBeLessThan(0); // −x, toward the camera
    expect(Math.abs(CHALLENGER_LANE)).toBeGreaterThan(0.5); // a real lane apart
    expect(Math.abs(CHALLENGER_LANE)).toBeLessThan(4.5); // still on the road
  });
});

describe("passSwap", () => {
  it("is net-periodic over a lap (the grid loops seamlessly)", () => {
    for (const p of [0, 0.2, 0.59, 0.83]) {
      expect(passSwap(p)).toBeCloseTo(passSwap(p + 1), 9);
    }
  });

  it("never swings more than a small curve-param either way", () => {
    for (let i = 0; i <= 100; i++) {
      expect(Math.abs(passSwap(i / 100))).toBeLessThanOrEqual(0.03 + 1e-9);
    }
  });

  it("crosses zero RISING at the apex — enters behind, exits ahead", () => {
    // PASS_CENTER ≈ 0.59: level at the apex, behind just before, ahead just after.
    expect(passSwap(0.59)).toBeCloseTo(0, 6);
    expect(passSwap(0.59 - 0.08)).toBeLessThan(0); // behind the leader
    expect(passSwap(0.59 + 0.08)).toBeGreaterThan(0); // noses ahead
  });
});
