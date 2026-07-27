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
import {
  chapterById,
  chapterForSceneKey,
  FALLBACK_SCENE_KEY,
} from "./state/chapters";
import { TransitNotice } from "./transit-notice";
import { WorldCanvas } from "./world-canvas";

/**
 * The full 3D experience — canvas + loader + chapter HUD, plus dev overlays
 * gated behind ?debug=1 — in one dynamically-imported module so
 * three/fiber/drei/rapier/leva/zustand never reach a flat route. Resolves the
 * active chapter (?chapter= → store → default) and scene (?scene= overrides the
 * store), and gates the chapter HUD to any registered chapter scene (the
 * transit hold and the fixture dev scene are non-chapter, so they get no HUD;
 * the transit hold shows the next-chapter notice instead).
 */
export function WorldExperience({
  tier,
  isUltra,
  explicitUltra,
  onRendererError,
}: {
  tier: Exclude<CapabilityTier, "2d">;
  isUltra: boolean;
  /** Visitor explicitly opted into ultra (`?quality=ultra`); see QualityProvider. */
  explicitUltra: boolean;
  /** Fatal renderer-init failure → the parent steps down a tier (or to 2D). */
  onRendererError?: (error: unknown) => void;
}) {
  const debug = useDebugFlag();
  const sceneParam = useSceneParam();
  const chapterParam = useChapterParam();
  const storeScene = useChapter((s) => s.activeScene);
  const activeScene = sceneParam ?? storeScene;
  const isChapterScene = chapterForSceneKey(activeScene) !== undefined;
  // Touch pads only mount on chapter scenes — over the non-interactive transit
  // hold or the fixture harness they would be dead controls.
  const showTouchControls = isChapterScene;

  // ?chapter=<id> selects the starting chapter (ignored if it names no chapter).
  useEffect(() => {
    if (chapterParam && chapterById(chapterParam)) {
      chapterStore.getState().setChapter(chapterParam);
    }
  }, [chapterParam]);

  return (
    <>
      <WorldCanvas
        tier={tier}
        isUltra={isUltra}
        explicitUltra={explicitUltra}
        debug={debug}
        activeScene={activeScene}
        onRendererError={onRendererError}
      />
      {/* Before PreflightHud in the DOM (both z-auto), so the loader overlay
          covers the hold card until it fades. */}
      {activeScene === FALLBACK_SCENE_KEY ? <TransitNotice /> : null}
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
