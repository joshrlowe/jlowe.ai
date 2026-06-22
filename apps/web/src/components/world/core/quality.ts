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
   *
   * `ssgi` carries its own ambient-occlusion term, so when it is on the
   * standalone `gtao` pass is dropped (compose-time) to avoid double-darkening;
   * `gtao` is the lighter contact-AO fallback for ultra without SSGI.
   */
  gtao: boolean;
  ssr: boolean;
  traa: boolean;
  motionBlur: boolean;
  /** Screen-space global illumination (indirect bounce + AO). Heaviest pass. */
  ssgi: boolean;
  /** Depth-of-field bokeh (cinematic focus falloff). */
  dof: boolean;
  /**
   * Warm/teal cinematic colour grade strength (lift-gamma-gain, 0 disables).
   * A scene-end TSL grade node — NOT a 3D-LUT — so it ships zero asset bytes.
   */
  colorGrade: number;
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
  ssgi: false,
  dof: false,
  colorGrade: 0,
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
  ssgi: false,
  dof: false,
  colorGrade: 0,
};

/**
 * The "ultra" preset — an additive extension of WEBGPU (never a tier of its
 * own). It raises `shadowMapSize`/`maxDpr` and flags the heavy WebGPU-only
 * passes; it only applies when the orthogonal ultra axis resolves ON and the
 * tier is `webgpu` (see `qualityFor`).
 *
 * The cinematic Forza-style stack — SSGI (indirect bounce + AO), wet-road SSR,
 * velocity motion-blur, depth-of-field, TRAA, and a warm/teal grade — is flagged
 * here but only ever BUILT in `core/post-fx.tsx` under
 * `isUltra && isWebGPUBackend && sceneSupportsUltraPostFX(scene)`. `gtao` stays
 * OFF because SSGI already supplies ambient occlusion (enabling both would
 * double-darken contacts).
 */
const ULTRA: QualitySettings = {
  ...WEBGPU,
  maxDpr: 2.5,
  shadowMapSize: 4096,
  gtao: false,
  ssr: true,
  ssgi: true,
  motionBlur: true,
  dof: true,
  traa: true,
  colorGrade: 1,
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
