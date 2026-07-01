"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo } from "react";
import type { Scene } from "three/webgpu";

import { buildEnvTexture } from "../../core/env-texture";
import { NIGHT_HARBOUR } from "../../core/env-gradient";
import { useQuality } from "../../core/quality-provider";

/**
 * Base IBL strength for the night hero scene (scaled by the per-tier factor).
 * Deliberately dim — the deep blue-violet sky is a low, cool key that only gives
 * the cars and set-dressing their shape; the warm building windows, yacht
 * cabins, headlights and brake lights (boosted emissives + bloom) are what the
 * eye actually reads.
 */
const NIGHT_ENV_INTENSITY = 0.6;

/** Radiance baked into the procedural night sky texture (kept at 1; the dim look
 * comes from `scene.environmentIntensity` above + the dark palette). */
const NIGHT_SKY_RADIANCE = 1;

interface EnvScene {
  environmentIntensity: Scene["environmentIntensity"];
}

/**
 * Set `scene.environmentIntensity` via a plain function (not inside the
 * component body) so the react-hooks immutability lint — which forbids mutating
 * a hook-returned value directly — is satisfied, exactly as HeroEnvironment /
 * HeroGrade do.
 */
function applyEnvIntensity(scene: EnvScene, intensity: number): void {
  scene.environmentIntensity = intensity;
}

/**
 * HERO-SCOPED night lighting: swaps the shared golden-hour sun/HDRI for a
 * Mediterranean night. A zero-byte procedural night sky (`NIGHT_HARBOUR`) drives
 * both the background and a dim cool IBL on every tier (no HDRI download); a
 * low, cool moon directional gives shape + the same soft shadow frustum the
 * golden sun used (opt-in via `sunCastShadow`), and a cool hemisphere fill lifts
 * the shadows just off black. `scene.environmentIntensity` is snapshotted and
 * restored on unmount so circuit / proving-ground stay pixel-identical.
 *
 * Mounted INSTEAD of `GoldenHourEnvironment` + `HeroSky` + `HeroEnvironment` for
 * the hero scene (see hero.tsx).
 */
export function HeroNight({
  sunCastShadow = false,
  shadowMapSize = 2048,
}: {
  sunCastShadow?: boolean;
  shadowMapSize?: number;
} = {}) {
  const { scene } = useThree();
  const { environmentIntensity: tierIntensity } = useQuality();

  const sky = useMemo(
    () => buildEnvTexture(NIGHT_HARBOUR, NIGHT_SKY_RADIANCE),
    [],
  );
  useEffect(() => () => sky.dispose(), [sky]);

  const intensity = NIGHT_ENV_INTENSITY * tierIntensity;
  useLayoutEffect(() => {
    const target = scene as unknown as EnvScene;
    const previous = target.environmentIntensity;
    applyEnvIntensity(target, intensity);
    return () => applyEnvIntensity(target, previous);
  }, [scene, intensity]);

  return (
    <>
      {/* One dark night sky for both the visible background and the IBL. */}
      <primitive object={sky} attach="background" />
      <primitive object={sky} attach="environment" />

      {/* Cool moon key — low intensity, high angle; reuses the golden sun's tight
          ortho shadow frustum so the cars still drop a soft contact shadow. */}
      <directionalLight
        position={[-30, 40, 20]}
        intensity={0.55}
        color="#7f93cf"
        castShadow={sunCastShadow}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-bias={-0.0006}
        shadow-normalBias={0.05}
        shadow-radius={sunCastShadow ? 6 : 1}
        shadow-blurSamples={sunCastShadow ? 16 : 8}
      >
        {sunCastShadow ? (
          <orthographicCamera
            attach="shadow-camera"
            args={[-22, 22, 22, -22, 28, 90]}
          />
        ) : null}
      </directionalLight>

      {/* Cool ambient so the shadow side reads as night, not pure black. */}
      <hemisphereLight color="#2a3350" groundColor="#050608" intensity={0.35} />

      {/* One warm accent from the city side — a pool of streetlamp/window bounce
          that keeps the near barrier and road from going flat. */}
      <pointLight
        position={[10, 5, 0]}
        intensity={40}
        distance={60}
        decay={2}
        color="#ffb066"
      />
    </>
  );
}
