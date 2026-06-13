"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { pass, smoothstep, uv } from "three/tsl";
import * as THREE from "three/webgpu";

import { useQuality } from "./quality-provider";

/**
 * A single TSL post-processing chain — ACES tone mapping (via the renderer) →
 * bloom → a soft vignette — that runs identically on the WebGPU and WebGL2
 * backends of WebGPURenderer. Verified against three r184's
 * webgpu_postprocessing_bloom example: RenderPipeline + `pass` + `bloom`.
 */
export function PostFX() {
  const { gl, scene, camera } = useThree();
  const quality = useQuality();

  const pipeline = useMemo(() => {
    // Tone mapping is set on the renderer at construction (see world-canvas).
    const renderer = gl as unknown as THREE.WebGPURenderer;
    const scenePass = pass(scene, camera);
    const color = scenePass.getTextureNode("output");
    const bloomPass = bloom(
      color,
      quality.bloomStrength,
      quality.bloomRadius,
      0.8,
    );

    // Radial vignette from screen-space UV (no dedicated TSL node ships).
    const vignette = smoothstep(0.85, 0.35, uv().sub(0.5).length());

    const renderPipeline = new THREE.RenderPipeline(renderer);
    renderPipeline.outputNode = color.add(bloomPass).mul(vignette);
    return renderPipeline;
  }, [gl, scene, camera, quality.bloomStrength, quality.bloomRadius]);

  // A frame callback with priority > 0 takes the render loop over from R3F.
  useFrame(() => {
    pipeline.render();
  }, 1);

  useEffect(() => () => pipeline.dispose(), [pipeline]);

  return null;
}
