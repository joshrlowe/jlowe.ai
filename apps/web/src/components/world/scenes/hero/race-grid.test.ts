import { describe, expect, it } from "vitest";

import { passSwap, RACE_CARS } from "./race-grid";
import { HERO_TUNING } from "./tuning";

const AMP = HERO_TUNING.passAmp;
const CENTER = HERO_TUNING.passCenter;

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

describe("challenger lane (tuning default)", () => {
  it("is a close camera-side lane that stays on the road", () => {
    expect(HERO_TUNING.challengerLane).toBeLessThan(0); // −x, toward the camera
    expect(Math.abs(HERO_TUNING.challengerLane)).toBeGreaterThan(0.5); // a real lane apart
    expect(Math.abs(HERO_TUNING.challengerLane)).toBeLessThan(4.5); // still on the road
  });
});

describe("passSwap", () => {
  it("is net-periodic over a lap (the grid loops seamlessly)", () => {
    for (const p of [0, 0.2, CENTER, 0.83]) {
      expect(passSwap(p, AMP, CENTER)).toBeCloseTo(
        passSwap(p + 1, AMP, CENTER),
        9,
      );
    }
  });

  it("never swings more than the tuned amplitude either way", () => {
    for (let i = 0; i <= 100; i++) {
      expect(Math.abs(passSwap(i / 100, AMP, CENTER))).toBeLessThanOrEqual(
        AMP + 1e-9,
      );
    }
  });

  it("crosses zero RISING at the apex — enters behind, exits ahead", () => {
    // Level at the tuned centre, behind just before, ahead just after.
    expect(passSwap(CENTER, AMP, CENTER)).toBeCloseTo(0, 6);
    expect(passSwap(CENTER - 0.08, AMP, CENTER)).toBeLessThan(0); // behind the leader
    expect(passSwap(CENTER + 0.08, AMP, CENTER)).toBeGreaterThan(0); // noses ahead
  });
});
