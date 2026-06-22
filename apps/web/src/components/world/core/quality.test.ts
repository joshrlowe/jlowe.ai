import { describe, expect, it } from "vitest";

import { qualityFor, qualityForTier } from "./quality";

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

describe("qualityFor", () => {
  it("falls back to the standard webgpu preset when not ultra", () => {
    expect(qualityFor("webgpu", false)).toEqual(qualityForTier("webgpu"));
  });

  it("applies the ultra preset only on the webgpu tier", () => {
    const ultra = qualityFor("webgpu", true);
    const webgpu = qualityForTier("webgpu");
    expect(ultra.shadowMapSize).toBeGreaterThan(webgpu.shadowMapSize);
    expect(ultra.maxDpr).toBeGreaterThanOrEqual(webgpu.maxDpr);
    expect(ultra.ssr).toBe(true);
  });

  it("stacks the cinematic ultra post-FX passes (SSGI/MB/DoF/TRAA/grade)", () => {
    const ultra = qualityFor("webgpu", true);
    expect(ultra.ssgi).toBe(true);
    expect(ultra.motionBlur).toBe(true);
    expect(ultra.dof).toBe(true);
    expect(ultra.traa).toBe(true);
    expect(ultra.colorGrade).toBeGreaterThan(0);
  });

  it("drops standalone GTAO under ultra (SSGI carries the AO term)", () => {
    // Enabling both would double-darken contacts; SSGI's `.a` is the AO factor.
    expect(qualityFor("webgpu", true).gtao).toBe(false);
  });

  it("never enables ultra heavy passes on the floor presets", () => {
    for (const q of [qualityForTier("webgpu"), qualityForTier("webgl")]) {
      expect(q.gtao).toBe(false);
      expect(q.ssr).toBe(false);
      expect(q.traa).toBe(false);
      expect(q.motionBlur).toBe(false);
      expect(q.ssgi).toBe(false);
      expect(q.dof).toBe(false);
      expect(q.colorGrade).toBe(0);
    }
  });

  it("ignores isUltra on webgl/2d (lower tiers never go ultra)", () => {
    expect(qualityFor("webgl", true)).toEqual(qualityForTier("webgl"));
    expect(qualityFor("2d", true)).toEqual(qualityForTier("webgl"));
  });
});
