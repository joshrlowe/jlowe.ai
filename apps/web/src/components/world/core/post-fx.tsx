"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import {
  cos,
  pass,
  screenUV,
  sin,
  smoothstep,
  time,
  uv,
  vec2,
} from "three/tsl";
import * as THREE from "three/webgpu";

import { useQuality } from "./quality-provider";

/**
 * A single TSL post-processing chain — ACES tone mapping (via the renderer) →
 * heat-shimmer (WebGPU only) → bloom → a soft vignette — that runs on both
 * backends of WebGPURenderer. Verified against three r184's
 * webgpu_postprocessing_bloom example: RenderPipeline + `pass` + `bloom`, and
 * `TextureNode.sample(screenUV + offset)` for the screen-space heat distortion.
 */
export function PostFX() {
  const { gl, scene, camera } = useThree();
  const quality = useQuality();

  const pipeline = useMemo(() => {
    // Tone mapping is set on the renderer at construction (see world-canvas).
    const renderer = gl as unknown as THREE.WebGPURenderer;
    const scenePass = pass(scene, camera);
    const color = scenePass.getTextureNode("output");

    // Heat-shimmer: resample the rendered scene at a time-animated, horizon-
    // masked UV offset — hot air rising off the tarmac at golden hour. WebGPU
    // only (gated on the backend); on the WebGL2 fallback `base` stays the
    // undistorted scene color, so the chain is a clean no-op there.
    // `isWebGPUBackend` lives on the WebGPUBackend subclass; the typed
    // `renderer.backend` is the base `Backend`, so reach it structurally.
    const backend = renderer.backend as { isWebGPUBackend?: boolean };
    const isWebGPU = backend.isWebGPUBackend === true;
    // Widen to the resample-result node type so the shimmer branch can reassign.
    let base: ReturnType<typeof color.sample> = color;
    if (isWebGPU && quality.heatShimmer > 0) {
      const amp = quality.heatShimmer;
      const t = time.mul(1.6);
      // Strongest low on screen (near tarmac), fading out into the sky.
      const heat = smoothstep(0.78, 0.18, screenUV.y);
      const dx = sin(screenUV.y.mul(38).add(t))
        .add(sin(screenUV.x.mul(19).sub(t.mul(1.3))))
        .mul(amp)
        .mul(heat);
      const dy = cos(screenUV.x.mul(27).add(t.mul(0.8)))
        .mul(amp * 0.6)
        .mul(heat);
      base = color.sample(screenUV.add(vec2(dx, dy)));
    }

    const bloomPass = bloom(
      base,
      quality.bloomStrength,
      quality.bloomRadius,
      0.8,
    );

    // Radial vignette from screen-space UV (no dedicated TSL node ships).
    const vignette = smoothstep(0.85, 0.35, uv().sub(0.5).length());

    const renderPipeline = new THREE.RenderPipeline(renderer);
    renderPipeline.outputNode = base.add(bloomPass).mul(vignette);
    return renderPipeline;
  }, [
    gl,
    scene,
    camera,
    quality.bloomStrength,
    quality.bloomRadius,
    quality.heatShimmer,
  ]);

  // A frame callback with priority > 0 takes the render loop over from R3F.
  useFrame(() => {
    pipeline.render();
  }, 1);

  useEffect(() => () => pipeline.dispose(), [pipeline]);

  return null;
}
