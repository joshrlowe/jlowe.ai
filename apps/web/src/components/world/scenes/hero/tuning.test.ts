import { describe, expect, it } from "vitest";

import { HERO_TUNING } from "./tuning";

describe("HERO_TUNING", () => {
  it("every dial is a finite number", () => {
    for (const [key, value] of Object.entries(HERO_TUNING)) {
      expect(Number.isFinite(value), `${key} must be finite`).toBe(true);
    }
  });

  it("timing and geometry dials are physically sane", () => {
    expect(HERO_TUNING.lapSeconds).toBeGreaterThan(0);
    expect(HERO_TUNING.fogFar).toBeGreaterThan(HERO_TUNING.fogNear);
    expect(HERO_TUNING.fogNear).toBeGreaterThan(0);
    expect(HERO_TUNING.passAmp).toBeGreaterThanOrEqual(0);
    expect(HERO_TUNING.passCenter).toBeGreaterThanOrEqual(0);
    expect(HERO_TUNING.passCenter).toBeLessThan(1);
    expect(HERO_TUNING.windowLitRatio).toBeGreaterThanOrEqual(0);
    expect(HERO_TUNING.windowLitRatio).toBeLessThanOrEqual(1);
    expect(HERO_TUNING.fov).toBeGreaterThan(10);
    expect(HERO_TUNING.fov).toBeLessThan(120);
    expect(HERO_TUNING.bodyMetalness).toBeGreaterThanOrEqual(0);
    expect(HERO_TUNING.bodyMetalness).toBeLessThanOrEqual(1);
    expect(HERO_TUNING.bodyRoughness).toBeGreaterThanOrEqual(0);
    expect(HERO_TUNING.bodyRoughness).toBeLessThanOrEqual(1);
  });

  it("the camera sits on the harbour (−x) side and the pan clamp is a real window", () => {
    expect(HERO_TUNING.camX).toBeLessThan(0);
    expect(HERO_TUNING.clampX).toBeGreaterThan(0);
    expect(HERO_TUNING.clampZ).toBeGreaterThan(0);
    // The clamp must stay inside the dressed straight (set runs to z ≈ ±55).
    expect(HERO_TUNING.clampZ).toBeLessThan(50);
  });
});
