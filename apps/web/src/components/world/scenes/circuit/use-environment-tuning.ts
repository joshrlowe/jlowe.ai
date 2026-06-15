"use client";

import { useControls } from "leva";

import { useQuality } from "../../core/quality-provider";

/**
 * Live golden-hour lighting tuning: the per-tier IBL intensity + the light
 * intensities, overridable by a leva "environment" panel (visible only under
 * ?debug=1, since <Leva> mounts only then). Dragging a slider rebuilds the IBL
 * texture / re-lights the scene live — so the reflection-strength pass is a
 * slider exercise, not a recompile loop.
 */
export function useEnvironmentTuning() {
  const { environmentIntensity } = useQuality();
  return useControls("environment", {
    environmentIntensity: {
      value: environmentIntensity,
      min: 0,
      max: 3,
      step: 0.05,
    },
    hemiIntensity: { value: 0.8, min: 0, max: 3, step: 0.05 },
    ambientIntensity: { value: 0.22, min: 0, max: 2, step: 0.02 },
    keyIntensity: { value: 2.8, min: 0, max: 8, step: 0.1 },
    fillIntensity: { value: 0.7, min: 0, max: 4, step: 0.05 },
  });
}
