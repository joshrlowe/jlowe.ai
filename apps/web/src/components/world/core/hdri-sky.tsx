"use client";

import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import * as THREE from "three/webgpu";

const HDRI_URL = "/hdri/venice_sunset_1k.hdr";

/**
 * Real golden-hour HDRI for image-based lighting + a sky background. Loaded
 * through R3F's loading manager (so the pre-flight bar shows real progress) and
 * assigned to `scene.environment` (node-PMREM IBL — gives the car/sea real
 * reflections) and `scene.background` (equirect skybox). WebGPU tier only; the
 * WebGL2/mobile tiers keep the zero-byte procedural sky.
 *
 * Attached declaratively via `<primitive>` (no scene mutation), cloned per slot
 * so each primitive owns its own disposal. CC0 HDRI from Poly Haven.
 */
export function HdriSky() {
  const loaded = useLoader(RGBELoader, HDRI_URL);
  const [environmentMap, backgroundMap] = useMemo(() => {
    const equirect = () => {
      const t = loaded.clone();
      t.mapping = THREE.EquirectangularReflectionMapping;
      t.needsUpdate = true;
      return t;
    };
    return [equirect(), equirect()];
  }, [loaded]);

  return (
    <>
      <primitive object={environmentMap} attach="environment" />
      <primitive object={backgroundMap} attach="background" />
    </>
  );
}
