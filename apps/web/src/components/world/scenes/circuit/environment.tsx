"use client";

import { useMemo } from "react";

import { buildEnvTexture, GOLDEN_HOUR } from "../../core/env-texture";
import { useEnvironmentTuning } from "./use-environment-tuning";

/**
 * Golden-hour lighting: a pure-light rig (warm key sun + cool fill + hemisphere
 * ambient) PLUS a procedural equirect environment map for image-based
 * reflections on the sea and car body. We avoid drei's `<Environment>` (it
 * PMREM-bakes through a GLSL `ShaderMaterial` the WebGPU NodeBuilder rejects);
 * attaching `buildEnvTexture` to `scene.environment` runs it through the
 * renderer's node-based PMREM instead — WebGPU-safe, zero asset bytes, both
 * backends. The texture is attached declaratively (auto-disposed on unmount);
 * all intensities are leva-tunable under ?debug=1.
 */
export function GoldenHourEnvironment() {
  const {
    environmentIntensity,
    hemiIntensity,
    ambientIntensity,
    keyIntensity,
    fillIntensity,
  } = useEnvironmentTuning();
  const envTexture = useMemo(
    () => buildEnvTexture(GOLDEN_HOUR, environmentIntensity),
    [environmentIntensity],
  );

  return (
    <>
      <color attach="background" args={["#241405"]} />
      <primitive object={envTexture} attach="environment" />
      <hemisphereLight
        color="#8a74b0"
        groundColor="#3a2410"
        intensity={hemiIntensity}
      />
      <ambientLight intensity={ambientIntensity} color="#ffb877" />
      <directionalLight
        position={[-50, 14, 18]}
        intensity={keyIntensity}
        color="#ff9b4a"
      />
      <directionalLight
        position={[24, 26, -34]}
        intensity={fillIntensity}
        color="#6b5a8c"
      />
    </>
  );
}
