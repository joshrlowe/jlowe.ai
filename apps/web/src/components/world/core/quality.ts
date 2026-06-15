import type { CapabilityTier } from "@/lib/capabilities";

/** Per-tier quality knobs consumed by the scene framework and FX. */
export interface QualitySettings {
  maxDpr: number;
  msaaSamples: number;
  bloomStrength: number;
  bloomRadius: number;
  /** Heat-shimmer UV amplitude (screen fraction); 0 disables. WebGPU only. */
  heatShimmer: number;
  /** IBL strength applied to `scene.environment` (the procedural sky map). */
  environmentIntensity: number;
  /** Real HDRI for IBL + sky (WebGPU); WebGL2/mobile use the procedural sky. */
  hdri: boolean;
  shadowMapSize: number;
  maxParticles: number;
  /**
   * GTAO screen-space ambient occlusion in the post-FX chain (WebGPU only). On
   * the WebGL2/mobile tier the chain skips the MRT + AO pass entirely (it stays
   * the plain color→grade→grain chain). The AO is applied as a darken-only
   * multiply, so it can only deepen contact shadows, never black-screen.
   */
  ssao: boolean;
}

const WEBGPU: QualitySettings = {
  maxDpr: 2,
  msaaSamples: 4,
  bloomStrength: 0.9,
  bloomRadius: 0.6,
  heatShimmer: 0.006,
  environmentIntensity: 1.0,
  hdri: true,
  shadowMapSize: 2048,
  maxParticles: 20000,
  ssao: true,
};

const WEBGL: QualitySettings = {
  maxDpr: 1.5,
  msaaSamples: 0,
  bloomStrength: 0.6,
  bloomRadius: 0.5,
  heatShimmer: 0,
  environmentIntensity: 0.85,
  hdri: false,
  shadowMapSize: 1024,
  maxParticles: 5000,
  ssao: false,
};

/**
 * Both 3D tiers run the same scenes; only these knobs differ. `2d` never mounts
 * the canvas, so it defensively maps to the WebGL floor.
 */
export function qualityForTier(tier: CapabilityTier): QualitySettings {
  return tier === "webgpu" ? WEBGPU : WEBGL;
}
