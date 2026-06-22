"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { ao } from "three/addons/tsl/display/GTAONode.js";
import { ssr } from "three/addons/tsl/display/SSRNode.js";
import {
  cos,
  metalness,
  mrt,
  normalView,
  output,
  pass,
  roughness,
  screenUV,
  sin,
  smoothstep,
  time,
  uv,
  vec2,
  vec3,
  vec4,
  velocity,
} from "three/tsl";
import * as THREE from "three/webgpu";

import type { QualitySettings } from "./quality";
import { useIsUltra, useQuality } from "./quality-provider";
import { sceneSupportsUltraPostFX } from "./scene-capabilities";

type ScenePass = ReturnType<typeof pass>;

/**
 * Ultra-only post-FX graph (WebGPU backend only — never reached on webgl/2d or
 * when `isUltra` is false). Promotes the scene pass to MRT (output + normal +
 * metalness + roughness + velocity), then stacks GTAO contact-darkening and
 * wet-road SSR over the same bloom + vignette floor the floor path renders.
 */
function composeUltra(
  scenePass: ScenePass,
  camera: THREE.Camera,
  quality: QualitySettings,
): THREE.Node {
  scenePass.setMRT(
    mrt({
      output,
      normal: normalView,
      metalness,
      roughness,
      velocity,
    }),
  );

  const color = scenePass.getTextureNode("output");
  const depth = scenePass.getTextureNode("depth");
  const normalTex = scenePass.getTextureNode("normal");
  const metalnessTex = scenePass.getTextureNode("metalness");
  const roughnessTex = scenePass.getTextureNode("roughness");

  // GTAO grounds objects: multiply the lit color by the AO factor so contacts
  // (car-to-road, prop bases, wheel wells) darken.
  const aoFactor = ao(depth, normalTex, camera).getTextureNode();
  const grounded = color.mul(vec4(vec3(aoFactor.r), 1));

  // Wet-road SSR: the node discards non-metallic fragments internally, so only
  // the glossy road zone + metallic car body reflect; add it over the color.
  const reflections = ssr(
    color,
    depth,
    normalTex,
    metalnessTex,
    roughnessTex,
    camera,
  ).getTextureNode();
  const reflective = grounded.add(reflections);

  const bloomPass = bloom(
    reflective,
    quality.bloomStrength,
    quality.bloomRadius,
    0.8,
  );
  const vignette = smoothstep(0.85, 0.35, uv().sub(0.5).length());
  return reflective.add(bloomPass).mul(vignette);
}

/**
 * A single TSL post-processing chain — ACES tone mapping (via the renderer) →
 * heat-shimmer (WebGPU only) → bloom → a soft vignette — that runs on both
 * backends of WebGPURenderer. Verified against three r184's
 * webgpu_postprocessing_bloom example: RenderPipeline + `pass` + `bloom`, and
 * `TextureNode.sample(screenUV + offset)` for the screen-space heat distortion.
 */
export function PostFX({ activeScene }: { activeScene: string }) {
  const { gl, scene, camera } = useThree();
  const quality = useQuality();
  const isUltra = useIsUltra();

  const pipeline = useMemo(() => {
    // Tone mapping is set on the renderer at construction (see world-canvas).
    const renderer = gl as unknown as THREE.WebGPURenderer;
    const scenePass = pass(scene, camera);

    // `isWebGPUBackend` lives on the WebGPUBackend subclass; the typed
    // `renderer.backend` is the base `Backend`, so reach it structurally.
    const backend = renderer.backend as { isWebGPUBackend?: boolean };
    const isWebGPU = backend.isWebGPUBackend === true;

    // Ultra branch (WebGPU backend only, AND only scenes that opt in): MRT +
    // GTAO + wet-road SSR over the floor. The post-FX chain is scene-agnostic,
    // so the scene gate is what keeps circuit / proving-ground floor-only under
    // ?quality=ultra. The webgl/2d backends, every non-ultra path, and
    // non-opted-in scenes skip this entirely — no MRT, no ultra nodes — keeping
    // the bloom+vignette floor byte-for-byte identical to before.
    if (isUltra && isWebGPU && sceneSupportsUltraPostFX(activeScene)) {
      const renderPipeline = new THREE.RenderPipeline(renderer);
      renderPipeline.outputNode = composeUltra(scenePass, camera, quality);
      return renderPipeline;
    }

    const color = scenePass.getTextureNode("output");

    // Heat-shimmer: resample the rendered scene at a time-animated, horizon-
    // masked UV offset — hot air rising off the tarmac at golden hour. WebGPU
    // only (gated on the backend); on the WebGL2 fallback `base` stays the
    // undistorted scene color, so the chain is a clean no-op there.
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
  }, [gl, scene, camera, isUltra, quality, activeScene]);

  // A frame callback with priority > 0 takes the render loop over from R3F.
  useFrame(() => {
    pipeline.render();
  }, 1);

  useEffect(() => () => pipeline.dispose(), [pipeline]);

  return null;
}
