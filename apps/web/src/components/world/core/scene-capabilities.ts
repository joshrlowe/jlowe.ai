/**
 * Per-scene rendering capability flags — the source of truth for which scenes
 * opt into scene-specific, otherwise-global render features.
 *
 * The post-FX chain (`core/post-fx.tsx`) is a single, scene-agnostic
 * `RenderPipeline`, so gating an effect on `isUltra && backend.isWebGPUBackend`
 * alone is NOT enough: it would silently alter every scene under
 * `?quality=ultra` on WebGPU. The ultra MRT + cinematic branch must therefore
 * additionally be scoped to scenes that declare support here.
 *
 * The set is empty today: the hero night vignette (the only opted-in scene)
 * retired with the driving world to the jlowe-world repo. The Anchorage space
 * world's cinematic scenes opt back in by name; until then every scene renders
 * the bloom+vignette floor on every tier.
 */

const ULTRA_POSTFX_SCENES: ReadonlySet<string> = new Set<string>();

/**
 * Whether the given scene key opts into the ultra-only heavy post-FX branch.
 * Uses `Set.has` (no prototype-chain traversal) so untrusted `?scene=` values
 * like `__proto__`/`constructor` resolve to `false`, never the ultra branch.
 */
export function sceneSupportsUltraPostFX(sceneKey: string): boolean {
  return ULTRA_POSTFX_SCENES.has(sceneKey);
}
