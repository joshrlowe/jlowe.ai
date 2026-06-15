"use client";

import { useMemo } from "react";

import { buildEnvTexture, GOLDEN_HOUR } from "../../core/env-texture";
import { HdriSky } from "../../core/hdri-sky";
import { useQuality } from "../../core/quality-provider";
import { useEnvironmentTuning } from "./use-environment-tuning";

/** WebGL2/mobile fallback: the zero-byte procedural equirect sky. */
function ProceduralSky({ intensity }: { intensity: number }) {
  const texture = useMemo(
    () => buildEnvTexture(GOLDEN_HOUR, intensity),
    [intensity],
  );
  return (
    <>
      <color attach="background" args={["#241405"]} />
      <primitive object={texture} attach="environment" />
    </>
  );
}

/**
 * Golden-hour lighting. On the WebGPU tier a real Poly Haven HDRI drives
 * image-based lighting + a sky background (`HdriSky`); the WebGL2/mobile tiers
 * fall back to the zero-byte procedural sky. A warm key sun stays on both paths
 * (highlights, and the CSM shadows added next); the hemisphere/ambient/fill
 * lights only matter without HDRI IBL (which supplies them). Leva-tunable
 * (?debug=1).
 */
export function GoldenHourEnvironment() {
  const { hdri } = useQuality();
  const t = useEnvironmentTuning();

  return (
    <>
      {hdri ? (
        <HdriSky />
      ) : (
        <ProceduralSky intensity={t.environmentIntensity} />
      )}

      <directionalLight
        position={[-50, 14, 18]}
        intensity={hdri ? 1.5 : t.keyIntensity}
        color="#ff9b4a"
      />

      {hdri ? null : (
        <>
          <hemisphereLight
            color="#8a74b0"
            groundColor="#3a2410"
            intensity={t.hemiIntensity}
          />
          <ambientLight intensity={t.ambientIntensity} color="#ffb877" />
          <directionalLight
            position={[24, 26, -34]}
            intensity={t.fillIntensity}
            color="#6b5a8c"
          />
        </>
      )}
    </>
  );
}
