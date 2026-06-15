"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { ao } from "three/addons/tsl/display/GTAONode.js";
import {
  clamp,
  cos,
  dot,
  float,
  fract,
  luminance,
  mix,
  mrt,
  normalView,
  oneMinus,
  output,
  pass,
  saturation,
  screenUV,
  sin,
  smoothstep,
  time,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import * as THREE from "three/webgpu";

import { useQuality } from "./quality-provider";
import { usePostFXTuning } from "./use-post-fx-tuning";

/**
 * A single TSL post-processing chain that runs on both backends of
 * WebGPURenderer: ACES tone mapping (via the renderer) → heat-shimmer (WebGPU
 * only) → bloom → GTAO darken (WebGPU only) → golden-hour color grade → film
 * grain → a soft vignette.
 *
 * Verified against three r184: RenderPipeline + `pass` + `bloom`
 * (webgpu_postprocessing_bloom), `TextureNode.sample(screenUV + offset)` for
 * the heat distortion, and GTAONode's documented MRT recipe
 * (`setMRT(mrt({ output, normal: normalView }))` → `ao(depth, normal, camera)`
 * → `.getTextureNode().r` is the occlusion factor ∈[0,1]).
 *
 * Progressive enhancement: the grade + grain are pure math on the final color
 * and run on **both** tiers (zero black-screen risk). GTAO is gated to the
 * WebGPU tier (`quality.ssao`, leva-toggleable under `?debug=1`); on the
 * WebGL2/no-SSAO path the MRT + AO pass are never created and the chain is
 * exactly color → grade → grain → vignette. AO is combined as a darken-only
 * multiply (`color.mul(clamp(aoFactor, 0, 1))`), so it can only deepen contact
 * shadows — never blacken the frame.
 */
export function PostFX() {
  const { gl, scene, camera } = useThree();
  const quality = useQuality();
  const tuning = usePostFXTuning();

  const pipeline = useMemo(() => {
    // Tone mapping is set on the renderer at construction (see world-canvas).
    const renderer = gl as unknown as THREE.WebGPURenderer;
    // `isWebGPUBackend` lives on the WebGPUBackend subclass; the typed
    // `renderer.backend` is the base `Backend`, so reach it structurally.
    const backend = renderer.backend as { isWebGPUBackend?: boolean };
    const isWebGPU = backend.isWebGPUBackend === true;

    const scenePass = pass(scene, camera);

    // GTAO needs view-space normals from the scene pass via MRT. Only set the
    // MRT (and build the AO pass) on the WebGPU tier with SSAO enabled — the
    // fallback path leaves the pass single-target so the chain is unchanged.
    const ssaoOn = isWebGPU && quality.ssao && tuning.ssao;
    if (ssaoOn) {
      scenePass.setMRT(mrt({ output, normal: normalView }));
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

    // Scene + bloom (vec4). GTAO is a darken-only multiply applied here, in
    // linear space, before the grade. `aoFactor` ∈ [0,1] (1 = unoccluded),
    // clamped defensively so a degenerate AO sample can never push the frame
    // negative or brighter — it can only deepen contact shadows.
    let lit = base.add(bloomPass);
    if (ssaoOn) {
      const aoFactor = ao(
        scenePass.getTextureNode("depth"),
        scenePass.getTextureNode("normal"),
        camera,
      ).getTextureNode().r;
      lit = lit.mul(clamp(aoFactor, 0, 1));
    }

    // Golden-hour color grade (both tiers, pure math on the rgb):
    //  • a modest saturation lift,
    //  • a gentle filmic contrast (blend toward an S-curve), and
    //  • a subtle warm tint to cohere the golden-hour mood.
    let graded = saturation(lit.rgb, float(tuning.saturation));
    // Filmic contrast: blend toward the Hermite S-curve `c²(3 − 2c)` (the
    // component-wise `smoothstep(0,1,c)`, written out so it stays vec3-typed).
    const sCurve = graded.mul(graded).mul(float(3).sub(graded.mul(2)));
    graded = mix(graded, sCurve, float(tuning.contrast));
    graded = graded.mul(vec3(1.03, 1.0, 0.96));

    // Film grain: a classic time-animated screen-space hash, strongest in
    // shadows (scaled by `oneMinus(luminance)`) so highlights stay clean. The
    // noise is centered to ±amp so it neither brightens nor darkens on average.
    const grainHash = fract(
      sin(dot(screenUV, vec2(12.9898, 78.233)).add(time)).mul(43758.5453),
    );
    const grain = grainHash
      .sub(0.5)
      .mul(2)
      .mul(float(tuning.grain))
      .mul(oneMinus(luminance(graded)));
    graded = graded.add(grain);

    // Radial vignette from screen-space UV (no dedicated TSL node ships).
    const vignette = smoothstep(0.85, 0.35, uv().sub(0.5).length());

    const renderPipeline = new THREE.RenderPipeline(renderer);
    renderPipeline.outputNode = vec4(graded.mul(vignette), 1);
    return renderPipeline;
  }, [
    gl,
    scene,
    camera,
    quality.bloomStrength,
    quality.bloomRadius,
    quality.heatShimmer,
    quality.ssao,
    tuning.ssao,
    tuning.saturation,
    tuning.contrast,
    tuning.grain,
  ]);

  // A frame callback with priority > 0 takes the render loop over from R3F.
  useFrame(() => {
    pipeline.render();
  }, 1);

  useEffect(() => () => pipeline.dispose(), [pipeline]);

  return null;
}
