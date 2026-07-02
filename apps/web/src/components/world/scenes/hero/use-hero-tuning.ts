"use client";

import { folder, useControls } from "leva";

import { HERO_TUNING, type HeroTuning } from "./tuning";

/**
 * The live hero-scene tuning: `HERO_TUNING` constants overridden by a leva
 * "hero" panel (visible only under ?debug=1, since <Leva> mounts only then) —
 * the same idiom as `useVehicleTuning`. The scene re-reads these every frame /
 * re-render, so night brightness, the battle choreography, the camera framing
 * and the fog are all slider exercises on dev instead of a PR round-trip each.
 * Dial numbers that feel right get pasted back into `tuning.ts` as the new
 * defaults.
 */
export function useHeroTuning(): HeroTuning {
  const o = useControls("hero", {
    race: folder({
      lapSeconds: { value: HERO_TUNING.lapSeconds, min: 3, max: 16, step: 0.5 },
      challengerLane: {
        value: HERO_TUNING.challengerLane,
        min: -2.5,
        max: 2.5,
        step: 0.05,
      },
      passAmp: { value: HERO_TUNING.passAmp, min: 0, max: 0.08, step: 0.002 },
      passCenter: {
        value: HERO_TUNING.passCenter,
        min: 0,
        max: 1,
        step: 0.005,
      },
    }),
    camera: folder({
      camX: { value: HERO_TUNING.camX, min: -24, max: 0, step: 0.25 },
      camY: { value: HERO_TUNING.camY, min: 0.5, max: 14, step: 0.1 },
      camZ: { value: HERO_TUNING.camZ, min: -25, max: 25, step: 0.25 },
      fov: { value: HERO_TUNING.fov, min: 18, max: 70, step: 1 },
      lookHeight: { value: HERO_TUNING.lookHeight, min: 0, max: 2, step: 0.05 },
      lookDamping: {
        value: HERO_TUNING.lookDamping,
        min: 0.0001,
        max: 0.1,
        step: 0.0001,
      },
      dollyAmplitude: {
        value: HERO_TUNING.dollyAmplitude,
        min: 0,
        max: 4,
        step: 0.1,
      },
      dollySpeed: { value: HERO_TUNING.dollySpeed, min: 0, max: 1, step: 0.01 },
      clampX: { value: HERO_TUNING.clampX, min: 0, max: 20, step: 0.5 },
      clampZ: { value: HERO_TUNING.clampZ, min: 5, max: 45, step: 0.5 },
    }),
    night: folder({
      envIntensity: {
        value: HERO_TUNING.envIntensity,
        min: 0,
        max: 2,
        step: 0.02,
      },
      moonIntensity: {
        value: HERO_TUNING.moonIntensity,
        min: 0,
        max: 2,
        step: 0.05,
      },
      hemiIntensity: {
        value: HERO_TUNING.hemiIntensity,
        min: 0,
        max: 1.5,
        step: 0.05,
      },
      cityPointIntensity: {
        value: HERO_TUNING.cityPointIntensity,
        min: 0,
        max: 150,
        step: 5,
      },
      exposure: { value: HERO_TUNING.exposure, min: 0.4, max: 2, step: 0.05 },
      fogNear: { value: HERO_TUNING.fogNear, min: 5, max: 80, step: 1 },
      fogFar: { value: HERO_TUNING.fogFar, min: 40, max: 220, step: 5 },
      envGlowIntensity: {
        value: HERO_TUNING.envGlowIntensity,
        min: 0,
        max: 8,
        step: 0.1,
      },
      floodlightHeadEmissive: {
        value: HERO_TUNING.floodlightHeadEmissive,
        min: 0,
        max: 16,
        step: 0.5,
      },
      floodlightPoolIntensity: {
        value: HERO_TUNING.floodlightPoolIntensity,
        min: 0,
        max: 800,
        step: 10,
      },
    }),
    set: folder({
      windowEmissive: {
        value: HERO_TUNING.windowEmissive,
        min: 0,
        max: 8,
        step: 0.1,
      },
      windowLitRatio: {
        value: HERO_TUNING.windowLitRatio,
        min: 0,
        max: 1,
        step: 0.05,
      },
      cabinEmissive: {
        value: HERO_TUNING.cabinEmissive,
        min: 0,
        max: 4,
        step: 0.05,
      },
      waterStreakIntensity: {
        value: HERO_TUNING.waterStreakIntensity,
        min: 0,
        max: 2,
        step: 0.05,
      },
    }),
    car: folder({
      bodyMetalness: {
        value: HERO_TUNING.bodyMetalness,
        min: 0,
        max: 1,
        step: 0.05,
      },
      bodyRoughness: {
        value: HERO_TUNING.bodyRoughness,
        min: 0,
        max: 1,
        step: 0.02,
      },
      bodyEnvMapIntensity: {
        value: HERO_TUNING.bodyEnvMapIntensity,
        min: 0,
        max: 4,
        step: 0.1,
      },
      rainLightEmissive: {
        value: HERO_TUNING.rainLightEmissive,
        min: 0,
        max: 12,
        step: 0.25,
      },
      rainLightY: {
        value: HERO_TUNING.rainLightY,
        min: 0.1,
        max: 1.2,
        step: 0.01,
      },
      rainLightZ: {
        value: HERO_TUNING.rainLightZ,
        min: -2.2,
        max: 0,
        step: 0.01,
      },
    }),
  });
  return { ...HERO_TUNING, ...o };
}
