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
  });

  it("gates GTAO to the webgpu tier (webgl skips the AO pass)", () => {
    expect(qualityForTier("webgpu").ssao).toBe(true);
    expect(qualityForTier("webgl").ssao).toBe(false);
  });

  it("maps the 2d tier to the webgl floor", () => {
    expect(qualityForTier("2d")).toEqual(qualityForTier("webgl"));
  });
});
