"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo } from "react";
import * as THREE from "three/webgpu";

import { buildEnvTexture } from "../../core/env-texture";
import { type HorizonGlowComb, NIGHT_HARBOUR } from "../../core/env-gradient";
import { useQuality } from "../../core/quality-provider";
import { HERO_TUNING } from "./tuning";

/** Radiance baked into the procedural night sky texture (kept at 1; the dim look
 * comes from `scene.environmentIntensity` + the dark palette). */
const NIGHT_SKY_RADIANCE = 1;

/**
 * The floodlight-rig glow comb baked into the night IBL: a ring of hot warm
 * pulses just above the horizon. PMREM turns each pulse into a specular the
 * car paint and wet asphalt reflect on EVERY tier — without it a
 * metalness-0.95 body has only the near-black night gradient to mirror and
 * renders as a silhouette. `intensity` is the leva dial; the layout matches
 * the visual masts' vibe (floodlights.tsx), not their exact azimuths.
 */
function floodlightGlow(intensity: number): HorizonGlowComb {
  return {
    count: 14,
    vCenter: 0.53,
    vWidth: 0.05,
    sharpness: 24,
    color: [1.0, 0.93, 0.78],
    intensity,
  };
}

interface EnvScene {
  environmentIntensity: THREE.Scene["environmentIntensity"];
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

type SceneFog = THREE.Scene["fog"];

/** Assign `scene.fog` via a plain function — same lint idiom as above. */
function applySceneFog(scene: { fog: SceneFog }, fog: SceneFog): void {
  scene.fog = fog;
}

/** Retune the shared Fog instance — same lint idiom as above. The node renderer
 * reads `near`/`far` as live uniform references off this instance, so mutating
 * it updates the haze without any shader rebuild. */
function applyFogRange(fog: THREE.Fog, near: number, far: number): void {
  fog.near = near;
  fog.far = far;
}

/** The night haze colour = the sky palette's horizon band (sRGB → working
 * space), so the fogged far end of the straight dissolves seamlessly into the
 * procedural sky behind it. */
function nightFogColor(): THREE.Color {
  const [r, g, b] = NIGHT_HARBOUR.horizon;
  return new THREE.Color().setRGB(
    r / 255,
    g / 255,
    b / 255,
    THREE.SRGBColorSpace,
  );
}

/**
 * HERO-SCOPED night lighting: swaps the shared golden-hour sun/HDRI for a
 * Mediterranean night. A zero-byte procedural night sky (`NIGHT_HARBOUR`) drives
 * both the background and a dim cool IBL on every tier (no HDRI download); a
 * low, cool moon directional gives shape + the same soft shadow frustum the
 * golden sun used (opt-in via `sunCastShadow`); a cool hemisphere fill lifts
 * the shadows just off black; and a range fog tinted to the sky's horizon band
 * hazes out the far straight — night air, and the curtain that swallows the
 * set's edges and the drive loop's hidden U-turns. The scene is otherwise lit
 * by its emissives (building windows, yacht cabins, the cars' rain lights)
 * through bloom. `scene.environmentIntensity` and `scene.fog` are snapshotted
 * and restored on unmount so circuit / proving-ground stay pixel-identical.
 *
 * Mounted INSTEAD of `GoldenHourEnvironment` + `HeroSky` + `HeroEnvironment` for
 * the hero scene (see hero.tsx). All intensities are leva-dialable via
 * `useHeroTuning`.
 */
export function HeroNight({
  sunCastShadow = false,
  shadowMapSize = 2048,
  envIntensity = HERO_TUNING.envIntensity,
  moonIntensity = HERO_TUNING.moonIntensity,
  hemiIntensity = HERO_TUNING.hemiIntensity,
  cityPointIntensity = HERO_TUNING.cityPointIntensity,
  fogNear = HERO_TUNING.fogNear,
  fogFar = HERO_TUNING.fogFar,
  envGlowIntensity = HERO_TUNING.envGlowIntensity,
}: {
  sunCastShadow?: boolean;
  shadowMapSize?: number;
  envIntensity?: number;
  moonIntensity?: number;
  hemiIntensity?: number;
  cityPointIntensity?: number;
  fogNear?: number;
  fogFar?: number;
  envGlowIntensity?: number;
} = {}) {
  const { scene } = useThree();
  const { environmentIntensity: tierIntensity } = useQuality();

  // Rebuilt when the glow dial moves (a 256×128 float texture — debug-only
  // cost); the IBL re-convolves and the paint highlights follow live.
  const sky = useMemo(
    () =>
      buildEnvTexture(
        NIGHT_HARBOUR,
        NIGHT_SKY_RADIANCE,
        floodlightGlow(envGlowIntensity),
      ),
    [envGlowIntensity],
  );
  useEffect(() => () => sky.dispose(), [sky]);

  const intensity = envIntensity * tierIntensity;
  useLayoutEffect(() => {
    const target = scene as unknown as EnvScene;
    const previous = target.environmentIntensity;
    applyEnvIntensity(target, intensity);
    return () => applyEnvIntensity(target, previous);
  }, [scene, intensity]);

  // ONE stable Fog instance for the scene's lifetime; range dials mutate it in
  // place (live uniforms — no rebuild), and the scene assignment is snapshotted
  // so unmount restores whatever fog (usually none) the previous scene had.
  const fog = useMemo(() => new THREE.Fog(nightFogColor(), 35, 95), []);
  useLayoutEffect(() => {
    applyFogRange(fog, fogNear, fogFar);
  }, [fog, fogNear, fogFar]);
  useLayoutEffect(() => {
    const previous = scene.fog;
    applySceneFog(scene, fog);
    return () => applySceneFog(scene, previous);
  }, [scene, fog]);

  return (
    <>
      {/* One dark night sky for both the visible background and the IBL. */}
      <primitive object={sky} attach="background" />
      <primitive object={sky} attach="environment" />

      {/* Cool moon key — low intensity, high angle; reuses the golden sun's tight
          ortho shadow frustum so the cars still drop a soft contact shadow. */}
      <directionalLight
        position={[-30, 40, 20]}
        intensity={moonIntensity}
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
      <hemisphereLight
        color="#2a3350"
        groundColor="#050608"
        intensity={hemiIntensity}
      />

      {/* One warm accent from the city side — a pool of streetlamp/window bounce
          that keeps the near barrier and road from going flat. */}
      <pointLight
        position={[10, 5, 0]}
        intensity={cityPointIntensity}
        distance={60}
        decay={2}
        color="#ffb066"
      />
    </>
  );
}
