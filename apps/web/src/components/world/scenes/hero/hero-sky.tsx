"use client";

import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import * as THREE from "three/webgpu";

const PURESKY_URL = "/hdri/belfast_sunset_puresky_1k.hdr";

/**
 * A clean golden-hour SKY for the hero scene's visible background, replacing the
 * shared lighting HDRI's photographic skyline (Venice) — this is meant to read
 * as an F1 track, not a city. The lighting HDRI stays on `scene.environment`
 * (golden IBL untouched); ONLY the background is swapped.
 *
 * Mechanism: a later-mounted `attach="background"` (this component renders AFTER
 * `GoldenHourEnvironment` in `hero.tsx`) wins over `HdriSky`'s background and is
 * LIFO-restored on unmount, so circuit / proving-ground stay pixel-identical and
 * `HdriSky` (shared) is never touched. Rendered only on the WebGPU/`hdri` tier —
 * the WebGL2/2d tiers already show a clean zero-byte procedural sky (no skyline).
 *
 * CC0 "Belfast Sunset (Pure Sky)" HDRI from Poly Haven (no buildings). Cloned so
 * this primitive owns its own disposal, matching `HdriSky`.
 */
export function HeroSky() {
  const loaded = useLoader(RGBELoader, PURESKY_URL);
  const background = useMemo(() => {
    const t = loaded.clone();
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.needsUpdate = true;
    return t;
  }, [loaded]);

  return <primitive object={background} attach="background" />;
}
