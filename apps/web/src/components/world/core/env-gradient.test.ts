import { describe, expect, it } from "vitest";

import { envTexel } from "./env-gradient";

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
