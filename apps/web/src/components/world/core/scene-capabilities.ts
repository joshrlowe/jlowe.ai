/**
 * Per-scene rendering capability flags — the source of truth for which scenes
 * opt into scene-specific, otherwise-global render features.
 *
 * The post-FX chain (`core/post-fx.tsx`) is a single, scene-agnostic
 * `RenderPipeline`, so gating an effect on `isUltra && backend.isWebGPUBackend`
 * alone is NOT enough: it would silently alter every scene under
 * `?quality=ultra` on WebGPU. The ultra MRT + GTAO + wet-road SSR branch is the
 * hero PoC's look only, so it must additionally be scoped to the scenes that
 * declare support here. Existing scenes (circuit, proving-ground, fixture) are
 * deliberately absent, so they render the bloom+vignette floor on every tier.
 */

const ULTRA_POSTFX_SCENES: ReadonlySet<string> = new Set(["hero"]);

/**
 * Whether the given scene key opts into the ultra-only heavy post-FX branch.
 * Uses `Set.has` (no prototype-chain traversal) so untrusted `?scene=` values
 * like `__proto__`/`constructor` resolve to `false`, never the ultra branch.
 */
export function sceneSupportsUltraPostFX(sceneKey: string): boolean {
  return ULTRA_POSTFX_SCENES.has(sceneKey);
}
