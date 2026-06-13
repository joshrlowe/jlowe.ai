"use client";

import type { CapabilityTier } from "@/lib/capabilities";

import { PreflightHud } from "./preflight-hud";
import { WorldCanvas } from "./world-canvas";

/**
 * The full 3D experience — canvas + the pre-flight loader overlay — kept in one
 * dynamically-imported module so three/fiber/drei never reach a flat route.
 */
export function WorldExperience({
  tier,
}: {
  tier: Exclude<CapabilityTier, "2d">;
}) {
  return (
    <>
      <WorldCanvas tier={tier} />
      <PreflightHud />
    </>
  );
}
