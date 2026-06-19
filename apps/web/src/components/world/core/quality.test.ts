import { describe, expect, it } from "vitest";

import { qualityForTier } from "./quality";

describe("qualityForTier", () => {
  it("gives the webgpu tier the higher budget", () => {
    const hi = qualityForTier("webgpu");
    const lo = qualityForTier("webgl");
    expect(hi.maxParticles).toBeGreaterThan(lo.maxParticles);
    expect(hi.msaaSamples).toBeGreaterThan(lo.msaaSamples);
    expect(hi.shadowMapSize).toBeGreaterThan(lo.shadowMapSize);
    expect(hi.environmentIntensity).toBeGreaterThan(lo.environmentIntensity);
    expect(hi.maxDpr).toBeGreaterThanOrEqual(lo.maxDpr);
  });

  it("exposes the renderer-wired shadow/dpr knobs as positive numbers", () => {
    for (const tier of ["webgpu", "webgl"] as const) {
      const q = qualityForTier(tier);
      expect(q.shadowMapSize).toBeGreaterThan(0);
      expect(q.maxDpr).toBeGreaterThan(0);
    }
  });

  it("maps the 2d tier to the webgl floor", () => {
    expect(qualityForTier("2d")).toEqual(qualityForTier("webgl"));
  });
});
