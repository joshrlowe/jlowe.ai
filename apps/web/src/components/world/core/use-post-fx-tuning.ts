"use client";

import { useControls } from "leva";

import { useQuality } from "./quality-provider";

/**
 * Live post-FX tuning: the GTAO toggle plus the golden-hour grade + grain
 * amounts, overridable by a leva "post-fx" panel (visible only under ?debug=1,
 * since <Leva> mounts only then). The SSAO toggle defaults to the per-tier
 * `quality.ssao` (webgpu true / webgl false) — the WebGL2 tier can't flip it on,
 * since the pipeline still gates GTAO behind the WebGPU backend (so the toggle
 * is a no-op there). Dragging a slider rebuilds the render pipeline live.
 */
export function usePostFXTuning() {
  const { ssao } = useQuality();
  return useControls("post-fx", {
    ssao: { value: ssao },
    saturation: { value: 1.12, min: 0.5, max: 2, step: 0.01 },
    contrast: { value: 0.15, min: 0, max: 0.6, step: 0.01 },
    grain: { value: 0.02, min: 0, max: 0.1, step: 0.005 },
  });
}
