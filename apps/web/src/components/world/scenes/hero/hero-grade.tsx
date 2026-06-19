"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three/webgpu";

// Cinematic golden-hour grade for the hero vignette: AgX rolls highlights off
// gently (no blown-out sky) and the slight exposure lift keeps shadow detail.
const HERO_TONE_MAPPING = THREE.AgXToneMapping;
const HERO_EXPOSURE = 1.1;

interface Gradeable {
  toneMapping: THREE.ToneMapping;
  toneMappingExposure: number;
}

// Applied via a plain function so the grade isn't a direct mutation of the
// hook-returned renderer (react-hooks/immutability).
function applyGrade(
  target: Gradeable,
  toneMapping: THREE.ToneMapping,
  exposure: number,
): void {
  target.toneMapping = toneMapping;
  target.toneMappingExposure = exposure;
}

/**
 * HERO-SCOPED tone mapping. `renderer.toneMapping`/`toneMappingExposure` are
 * shared global state, so we capture the prior values on mount and RESTORE them
 * on unmount — circuit / proving-ground stay pixel-identical. The PostFX
 * RenderPipeline re-derives its output transform when `toneMapping` changes, so
 * the grade applies (and reverts) cleanly on both backends.
 */
export function HeroGrade() {
  const { gl } = useThree();

  useEffect(() => {
    const renderer = gl as unknown as Gradeable;
    const prevToneMapping = renderer.toneMapping;
    const prevExposure = renderer.toneMappingExposure;
    applyGrade(renderer, HERO_TONE_MAPPING, HERO_EXPOSURE);
    return () => applyGrade(renderer, prevToneMapping, prevExposure);
  }, [gl]);

  return null;
}
