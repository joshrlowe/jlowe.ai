"use client";

import { Leva } from "leva";

import type { CapabilityTier } from "@/lib/capabilities";
import { useDebugFlag } from "@/lib/use-debug-flag";

import { PerfOverlay } from "./debug/perf-overlay";
import { PreflightHud } from "./preflight-hud";
import { WorldCanvas } from "./world-canvas";

/**
 * The full 3D experience — canvas + the pre-flight loader, plus dev overlays
 * gated behind ?debug=1 — kept in one dynamically-imported module so
 * three/fiber/drei/rapier/leva never reach a flat route.
 */
export function WorldExperience({
  tier,
}: {
  tier: Exclude<CapabilityTier, "2d">;
}) {
  const debug = useDebugFlag();

  return (
    <>
      <WorldCanvas tier={tier} debug={debug} />
      <PreflightHud />
      {debug ? <PerfOverlay /> : null}
      {debug ? <Leva collapsed /> : null}
    </>
  );
}
