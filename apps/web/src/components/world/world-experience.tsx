"use client";

import { Leva } from "leva";
import { useEffect } from "react";

import type { CapabilityTier } from "@/lib/capabilities";
import { useChapterParam } from "@/lib/use-chapter-param";
import { useDebugFlag } from "@/lib/use-debug-flag";
import { useSceneParam } from "@/lib/use-scene-param";

import { PerfOverlay } from "./debug/perf-overlay";
import { BeaconPanel } from "./hud/beacon-panel";
import { ChapterFade } from "./hud/chapter-fade";
import { ChapterHud } from "./hud/chapter-hud";
import { InputReadout } from "./hud/input-readout";
import { TouchControls } from "./hud/touch-controls";
import { WorldAudio } from "./hud/world-audio";
import { PreflightHud } from "./preflight-hud";
import { ChapterRouter } from "./state/chapter-router";
import { chapterStore, useChapter } from "./state/chapter-store";
import { chapterById, chapterForSceneKey } from "./state/chapters";
import { WorldCanvas } from "./world-canvas";

/**
 * The full 3D experience — canvas + loader + chapter HUD, plus dev overlays
 * gated behind ?debug=1 — in one dynamically-imported module so
 * three/fiber/drei/rapier/leva/zustand never reach a flat route. Resolves the
 * active chapter (?chapter= → store → default) and scene (?scene= overrides the
 * store), and gates the chapter HUD to any registered chapter scene (the
 * fixture/proving-ground dev scenes are non-chapter, so they get no HUD).
 */
export function WorldExperience({
  tier,
}: {
  tier: Exclude<CapabilityTier, "2d">;
}) {
  const debug = useDebugFlag();
  const sceneParam = useSceneParam();
  const chapterParam = useChapterParam();
  const storeScene = useChapter((s) => s.activeScene);
  const activeScene = sceneParam ?? storeScene;
  const isChapterScene = chapterForSceneKey(activeScene) !== undefined;
  // The hero vignette is a non-interactive cinematic; its driving touch pads
  // would be dead controls, so they must not mount there.
  const showTouchControls = activeScene !== "hero";

  // ?chapter=<id> selects the starting chapter (ignored if it names no chapter).
  useEffect(() => {
    if (chapterParam && chapterById(chapterParam)) {
      chapterStore.getState().setChapter(chapterParam);
    }
  }, [chapterParam]);

  return (
    <>
      <WorldCanvas tier={tier} debug={debug} activeScene={activeScene} />
      <PreflightHud />
      {showTouchControls ? <TouchControls /> : null}
      <ChapterRouter />
      {isChapterScene ? <ChapterHud /> : null}
      {isChapterScene ? <BeaconPanel /> : null}
      {isChapterScene ? <WorldAudio /> : null}
      {isChapterScene ? <ChapterFade /> : null}
      {debug ? <PerfOverlay /> : null}
      {debug ? <InputReadout /> : null}
      {debug ? <Leva collapsed /> : null}
    </>
  );
}
