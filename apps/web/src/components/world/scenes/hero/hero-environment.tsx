"use client";

import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import type { Scene } from "three/webgpu";

import { useQuality } from "../../core/quality-provider";

// Warm golden-hour key: lift the IBL a touch above neutral and yaw the HDRI so
// the low sun rakes across the car's flank (the long highlight streak that
// reads as "automotive render"). Pitch/roll stay 0 — only the azimuth matters
// for placing the sun. Defaults want a real GPU + the live ?debug=1 panel to
// dial; these are a sensible warm starting point, not a calibrated setup.
const DEFAULT_ENV_INTENSITY = 1.15;
const DEFAULT_ENV_YAW_DEG = 35;

interface EnvScene {
  environmentIntensity: Scene["environmentIntensity"];
  environmentRotation: Scene["environmentRotation"];
  backgroundRotation: Scene["backgroundRotation"];
}

interface EnvSettings {
  intensity: number;
  envYaw: number;
  bgYaw: number;
}

/** Snapshot the scene's current env lighting so it can be restored on unmount. */
function captureEnv(scene: EnvScene): EnvSettings {
  return {
    intensity: scene.environmentIntensity,
    envYaw: scene.environmentRotation.y,
    bgYaw: scene.backgroundRotation.y,
  };
}

/**
 * Apply env lighting. Mutates the scene via a plain function (not inside the
 * component body) so the react-hooks immutability lint — which forbids mutating
 * a hook-returned value directly — is satisfied, exactly as `HeroGrade` does
 * with the renderer.
 */
function applyEnv(scene: EnvScene, settings: EnvSettings): void {
  scene.environmentIntensity = settings.intensity;
  scene.environmentRotation.y = settings.envYaw;
  scene.backgroundRotation.y = settings.bgYaw;
}

/**
 * HERO-SCOPED environment lighting tuning. `scene.environmentIntensity` /
 * `environmentRotation` are shared global state, so — exactly like `HeroGrade`
 * with tone mapping — we snapshot the prior values on mount and RESTORE them on
 * unmount, keeping circuit / proving-ground pixel-identical.
 *
 * Applies on EVERY tier (it only nudges IBL strength + sky yaw, which the
 * procedural-sky fallback honours too), so it is not gated to ultra; the heavy
 * ultra-only effects live elsewhere. Hard-coded — no ?debug knobs.
 */
export function HeroEnvironment() {
  const { scene } = useThree();
  const { environmentIntensity: tierIntensity } = useQuality();

  // Hard-coded best-look values — no ?debug knobs. The hero is a fixed,
  // art-directed scene, not a tuning surface. Intensity is scaled by the
  // per-tier IBL strength so the WebGL fallback doesn't over-brighten.
  const envIntensity = DEFAULT_ENV_INTENSITY * tierIntensity;
  const envYawDeg = DEFAULT_ENV_YAW_DEG;

  useLayoutEffect(() => {
    const target = scene as unknown as EnvScene;
    const previous = captureEnv(target);
    // Rotate env + visible sky in lockstep so the sun disc and its IBL
    // reflection stay aligned.
    const yaw = (envYawDeg * Math.PI) / 180;
    applyEnv(target, { intensity: envIntensity, envYaw: yaw, bgYaw: yaw });
    return () => applyEnv(target, previous);
  }, [scene, envIntensity, envYawDeg]);

  return null;
}
