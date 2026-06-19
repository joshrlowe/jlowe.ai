"use client";

import { CameraRig } from "../core/camera-rig";
import { useQuality } from "../core/quality-provider";
import { GoldenHourEnvironment } from "./circuit/environment";
import type { CinematicPathConfig } from "./hero/camera-path";
import { HeroCar } from "./hero/hero-car";
import { HeroGrade } from "./hero/hero-grade";
import { HeroProps } from "./hero/props";
import { HeroRoad } from "./hero/road";

// Slow dolly-orbit around the parked car under the golden-hour sky.
const CINEMATIC: CinematicPathConfig = {
  center: [0, 0.6, 0],
  radius: 9,
  baseHeight: 3.4,
  heightAmplitude: 0.8,
  angularSpeed: 0.18,
  bobSpeed: 0.22,
  startAngle: 0.65,
};

/**
 * The additive `?scene=hero` vignette: the curated car on a short asphalt road
 * with roadside props, lit by the existing golden-hour HDRI, framed by a slow
 * cinematic camera. A NON-chapter scene — no FSM, no driving, no HUD/audio; it
 * reuses the universal bloom+vignette post-FX floor mounted by world-canvas.
 */
export function HeroScene() {
  const { shadowMapSize } = useQuality();
  return (
    <>
      <HeroGrade />
      <GoldenHourEnvironment sunCastShadow shadowMapSize={shadowMapSize} />
      <HeroRoad />
      <HeroProps />
      <HeroCar />
      <CameraRig mode="cinematic" cinematic={CINEMATIC} />
    </>
  );
}
