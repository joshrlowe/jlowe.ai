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
 * (highlights + soft shadows where a scene opts in); the hemisphere/ambient/fill
 * lights only matter without HDRI IBL (which supplies them). Leva-tunable
 * (?debug=1).
 *
 * `sunCastShadow` (default off) makes the warm key sun a PCFSoft shadow caster
 * with a frustum tuned to the hero vignette. It is opt-in so the circuit and
 * proving-ground (which pass no props) stay pixel-identical — enabling the
 * renderer shadow map has no effect unless meshes also opt in.
 */
export function GoldenHourEnvironment({
  sunCastShadow = false,
  shadowMapSize = 2048,
}: {
  sunCastShadow?: boolean;
  shadowMapSize?: number;
} = {}) {
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
        castShadow={sunCastShadow}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-bias={-0.0006}
        shadow-normalBias={0.05}
      >
        {sunCastShadow ? (
          // Ortho frustum sized to the hero road/car/props clustered near the
          // origin; the warm sun sits ~55u out, so near/far hug that span for
          // tight depth precision (kills grazing-angle acne).
          <orthographicCamera
            attach="shadow-camera"
            args={[-24, 24, 24, -24, 28, 90]}
          />
        ) : null}
      </directionalLight>

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
