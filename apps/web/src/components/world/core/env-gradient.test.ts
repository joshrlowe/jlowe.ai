import { describe, expect, it } from "vitest";

import { envTexel, glowCombAt, type HorizonGlowComb } from "./env-gradient";

const lum = ([r, g, b]: [number, number, number]) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

describe("envTexel", () => {
  it("brightens from nadir to horizon", () => {
    expect(lum(envTexel(0.5))).toBeGreaterThan(lum(envTexel(0)));
  });

  it("cools from horizon to zenith (higher blue:red ratio)", () => {
    const h = envTexel(0.5);
    const z = envTexel(1);
    expect(z[2] / z[0]).toBeGreaterThan(h[2] / h[0]);
  });

  it("clamps out-of-range latitude to the endpoints", () => {
    expect(envTexel(-1)).toEqual(envTexel(0));
    expect(envTexel(2)).toEqual(envTexel(1));
  });

  it("returns linear values within 0..1", () => {
    for (const v of [0, 0.25, 0.5, 0.75, 1]) {
      for (const c of envTexel(v)) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("glowCombAt", () => {
  const comb: HorizonGlowComb = {
    count: 14,
    vCenter: 0.53,
    vWidth: 0.05,
    sharpness: 24,
    color: [1.0, 0.93, 0.78],
    intensity: 2.5,
  };

  it("peaks at pulse centres (u = k/count) in the band centre", () => {
    const peak = glowCombAt(0, comb.vCenter, comb);
    expect(peak[0]).toBeCloseTo(comb.color[0] * comb.intensity, 6);
    const nextPeak = glowCombAt(1 / comb.count, comb.vCenter, comb);
    expect(nextPeak[0]).toBeCloseTo(peak[0], 6);
  });

  it("is dark between pulses", () => {
    // Half-way between two pulses cos() is negative → clamped to zero.
    const between = glowCombAt(0.5 / comb.count, comb.vCenter, comb);
    expect(between[0]).toBe(0);
  });

  it("vanishes outside the latitude band", () => {
    expect(glowCombAt(0, comb.vCenter + comb.vWidth, comb)[0]).toBe(0);
    expect(glowCombAt(0, 0, comb)[0]).toBe(0);
    expect(glowCombAt(0, 1, comb)[0]).toBe(0);
  });

  it("scales linearly with intensity and is never negative", () => {
    const half = glowCombAt(0, comb.vCenter, { ...comb, intensity: 1.25 });
    expect(half[0] * 2).toBeCloseTo(glowCombAt(0, comb.vCenter, comb)[0], 6);
    for (let i = 0; i <= 40; i++) {
      const [r, g, b] = glowCombAt(i / 40, 0.5 + (i % 5) / 50, comb);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(b).toBeGreaterThanOrEqual(0);
    }
  });
});
