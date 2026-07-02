"use client";

import { useControls } from "leva";

/**
 * The dialable post-FX constants, with the shipped look as defaults — the same
 * constants-plus-leva idiom as `useHeroTuning` / `useVehicleTuning`. These were
 * previously compile-time constants in `post-fx.tsx`, which is exactly why the
 * heavy stack could never be tuned into shape ("these want a real GPU to
 * dial"): every guess was a PR round-trip. Dragging a dial rebuilds the whole
 * RenderPipeline (a visible ~100 ms hitch) — acceptable for a ?debug=1-only
 * affordance, never hit in production.
 */
export interface PostFxTuning {
  /** DoF focus distance (world units). The fixed hero camera sits ~7–8.5 m
   * from the battle pair's lane, so focus defaults just past the challenger. */
  dofFocusDistance: number;
  dofFocalLength: number;
  dofBokehScale: number;
  /** Signed additive grain amplitude (linear, pre-tonemap). */
  filmGrain: number;
}

export const POSTFX_TUNING: PostFxTuning = {
  dofFocusDistance: 8,
  dofFocalLength: 3.2,
  dofBokehScale: 2.4,
  filmGrain: 0.015,
};

export function usePostFxTuning(): PostFxTuning {
  const o = useControls("postFX", {
    dofFocusDistance: {
      value: POSTFX_TUNING.dofFocusDistance,
      min: 1,
      max: 40,
      step: 0.25,
    },
    dofFocalLength: {
      value: POSTFX_TUNING.dofFocalLength,
      min: 0.5,
      max: 12,
      step: 0.1,
    },
    dofBokehScale: {
      value: POSTFX_TUNING.dofBokehScale,
      min: 0,
      max: 8,
      step: 0.1,
    },
    filmGrain: {
      value: POSTFX_TUNING.filmGrain,
      min: 0,
      max: 0.08,
      step: 0.001,
    },
  });
  return { ...POSTFX_TUNING, ...o };
}
