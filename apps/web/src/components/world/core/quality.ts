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
   * Ultra-only heavy post-FX gates. These mark WHICH passes the ultra tier
   * intends to stack; the passes themselves stay gated to
   * `isUltra && backend.isWebGPUBackend` in `core/post-fx.tsx` (never built on
   * webgl/2d). Off on every non-ultra preset — the bloom+vignette floor.
   */
  gtao: boolean;
  ssr: boolean;
  traa: boolean;
  motionBlur: boolean;
}

const WEBGPU: QualitySettings = {
  maxDpr: 2,
  msaaSamples: 4,
  bloomStrength: 0.9,
  bloomRadius: 0.6,
  // Heat-shimmer disabled by default: animating the whole screen reads as the
  // scene "wobbling". Re-enable (e.g. 0.003) for a subtle haze once tuned.
  heatShimmer: 0,
  environmentIntensity: 1.0,
  hdri: true,
  shadowMapSize: 2048,
  maxParticles: 20000,
  gtao: false,
  ssr: false,
  traa: false,
  motionBlur: false,
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
  gtao: false,
  ssr: false,
  traa: false,
  motionBlur: false,
};

/**
 * The "ultra" preset — an additive extension of WEBGPU (never a tier of its
 * own). It raises `shadowMapSize`/`maxDpr` and flags the heavy WebGPU-only
 * passes; it only applies when the orthogonal ultra axis resolves ON and the
 * tier is `webgpu` (see `qualityFor`).
 */
const ULTRA: QualitySettings = {
  ...WEBGPU,
  maxDpr: 2.5,
  shadowMapSize: 4096,
  gtao: true,
  ssr: true,
};

/**
 * Both 3D tiers run the same scenes; only these knobs differ. `2d` never mounts
 * the canvas, so it defensively maps to the WebGL floor.
 */
export function qualityForTier(tier: CapabilityTier): QualitySettings {
  return tier === "webgpu" ? WEBGPU : WEBGL;
}

/**
 * Tier preset with the ultra axis folded in. Ultra is gated to `webgpu`; on
 * any other tier `isUltra` is ignored (webgl/2d never get the ultra preset),
 * which keeps the lower tiers byte-identical to the floor.
 */
export function qualityFor(
  tier: CapabilityTier,
  isUltra: boolean,
): QualitySettings {
  if (tier === "webgpu") return isUltra ? ULTRA : WEBGPU;
  return WEBGL;
}
