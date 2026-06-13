"use client";

import { Leva } from "leva";

import type { CapabilityTier } from "@/lib/capabilities";
import { useDebugFlag } from "@/lib/use-debug-flag";
import { useSceneParam } from "@/lib/use-scene-param";

import { PerfOverlay } from "./debug/perf-overlay";
import { ChapterFade } from "./hud/chapter-fade";
import { ChapterHud } from "./hud/chapter-hud";
import { InputReadout } from "./hud/input-readout";
import { TouchControls } from "./hud/touch-controls";
import { PreflightHud } from "./preflight-hud";
import { useChapter } from "./state/chapter-store";
import { WorldCanvas } from "./world-canvas";

/**
 * The full 3D experience — canvas + loader + chapter HUD, plus dev overlays
 * gated behind ?debug=1 — in one dynamically-imported module so
 * three/fiber/drei/rapier/leva/zustand never reach a flat route. Resolves the
 * active scene (?scene= overrides the chapter store) and gates the chapter HUD
 * to the circuit.
 */
export function WorldExperience({
  tier,
}: {
  tier: Exclude<CapabilityTier, "2d">;
}) {
  const debug = useDebugFlag();
  const sceneParam = useSceneParam();
  const storeScene = useChapter((s) => s.activeScene);
  const activeScene = sceneParam ?? storeScene;
  const isCircuit = activeScene === "circuit";

  return (
    <>
      <WorldCanvas tier={tier} debug={debug} activeScene={activeScene} />
      <PreflightHud />
      <TouchControls />
      {isCircuit ? <ChapterHud /> : null}
      {isCircuit ? <ChapterFade /> : null}
      {debug ? <PerfOverlay /> : null}
      {debug ? <InputReadout /> : null}
      {debug ? <Leva collapsed /> : null}
    </>
  );
}
