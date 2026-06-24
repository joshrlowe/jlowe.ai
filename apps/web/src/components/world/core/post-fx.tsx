"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { dof } from "three/addons/tsl/display/DepthOfFieldNode.js";
import { ao } from "three/addons/tsl/display/GTAONode.js";
import { motionBlur } from "three/addons/tsl/display/MotionBlur.js";
import { ssgi } from "three/addons/tsl/display/SSGINode.js";
import { ssr } from "three/addons/tsl/display/SSRNode.js";
import { traa } from "three/addons/tsl/display/TRAANode.js";
import {
  cos,
  int,
  metalness,
  mix,
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
import type { Node, TextureNode } from "three/webgpu";

import { gradeColor } from "./color-grade";
import type { QualitySettings } from "./quality";
import { useExplicitUltra, useQuality } from "./quality-provider";
import { sceneSupportsUltraPostFX } from "./scene-capabilities";

type ScenePass = ReturnType<typeof pass>;

/** A chainable vec4 colour node (the post-FX chain works in vec4 throughout). */
type ColorNode = Node<"vec4">;

/**
 * `SSGINode`/`TRAANode`/`DepthOfFieldNode` all expose `getTextureNode(): Texture`
 * at runtime (verified in the r184 source), but `@types/three@0.184` omits the
 * declaration on these three (it IS declared on GTAONode/SSRNode/BloomNode).
 * This narrows the gap without an `any`: a structural type for "an effect node
 * whose rendered result is reachable as a chainable texture node".
 */
interface HasTextureNode {
  getTextureNode(): TextureNode;
}

// Cinematic depth-of-field defaults (world units), tuned for the parked hero car
// ~9u from the orbiting camera. These want a real GPU to dial — see PR notes.
const DOF_FOCUS_DISTANCE = 9;
const DOF_FOCAL_LENGTH = 3.2;
const DOF_BOKEH_SCALE = 2.4;
const MOTION_BLUR_SAMPLES = 12;

// Warm/teal grade strength carried by the reliable FLOOR on cinematic scenes
// (hero). The ultra branch grades at full `quality.colorGrade`; the floor uses a
// slightly gentler fixed amount so the DEFAULT arrival keeps the signature look
// without depending on the heavy stack. Scene-scoped — circuit / proving-ground
// stay ungraded.
const FLOOR_COLOR_GRADE = 0.8;

/**
 * Ultra-only cinematic post-FX graph (WebGPU backend only — never reached on
 * webgl/2d or when `isUltra` is false). Promotes the scene pass to MRT (output +
 * normal + metalness + roughness + velocity), then stacks the Forza-style
 * chain over the bloom + vignette floor:
 *
 *   scene → SSGI (indirect bounce + AO) → SSR (wet road / car metal) →
 *   TRAA (temporal AA) → motion-blur (velocity MRT) → DoF → bloom → warm grade
 *
 * Every pass is independently gated on a `quality` flag so it can be dialed
 * (or dropped on a tighter GPU) without touching the order. Each node verified
 * against the installed three r184 build (see PR notes): `ssgi`, `ssr`, `traa`,
 * `motionBlur`, `dof` all exist with the signatures used here.
 */
function composeUltra(
  scenePass: ScenePass,
  camera: THREE.Camera,
  quality: QualitySettings,
): ColorNode {
  scenePass.setMRT(
    mrt({
      output,
      normal: normalView,
      metalness,
      roughness,
      velocity,
    }),
  );

  // SSGI + DoF are typed for a `PerspectiveCamera`; the world only ever mounts
  // a perspective camera, so narrow structurally (no `any`).
  const perspective = camera as THREE.PerspectiveCamera;

  const color = scenePass.getTextureNode("output");
  const depth = scenePass.getTextureNode("depth");
  const normalTex = scenePass.getTextureNode("normal");
  const metalnessTex = scenePass.getTextureNode("metalness");
  const roughnessTex = scenePass.getTextureNode("roughness");
  const velocityTex = scenePass.getTextureNode("velocity");

  // --- Indirect lighting / AO ---------------------------------------------
  // SSGI evaluates to vec4(indirectGI.rgb, ao.a). The physically-correct
  // composite is `beauty * AO + GI`, which folds ambient occlusion in — so the
  // standalone GTAO pass is intentionally skipped under SSGI (the ULTRA preset
  // sets `gtao:false`) to avoid double-darkening. `gtao` stays the lighter
  // contact-AO path for an ultra config that disables SSGI.
  let lit: ColorNode = color;
  if (quality.ssgi) {
    // `SSGINode extends TempNode<"vec4">`, so the node is itself a chainable
    // vec4 colour node — `.rgb`/`.a` read straight off it.
    const gi: ColorNode = ssgi(color, depth, normalTex, perspective);
    lit = color.mul(gi.a).add(gi.rgb);
  } else if (quality.gtao) {
    const aoFactor = ao(depth, normalTex, camera).getTextureNode();
    lit = color.mul(vec4(vec3(aoFactor.r), 1));
  }

  // --- Screen-space reflections (wet road + car metal) --------------------
  // The node discards non-metallic fragments internally, so only the glossy
  // road zone + metallic body reflect; add it over the lit color.
  let reflective: ColorNode = lit;
  if (quality.ssr) {
    const reflections = ssr(
      lit,
      depth,
      normalTex,
      metalnessTex,
      roughnessTex,
      camera,
    ).getTextureNode();
    reflective = lit.add(reflections);
  }

  // --- Temporal AA ---------------------------------------------------------
  // TRAA resolves edge/temporal aliasing using history + the velocity MRT; it
  // jitters the camera projection internally (no camera-rig change needed).
  let resolved: ColorNode = reflective;
  if (quality.traa) {
    // `getTextureNode()` exists at runtime but is absent from TRAANode's r184
    // `.d.ts` — go through `unknown` to reach the structural `HasTextureNode`.
    const node = traa(
      reflective,
      depth,
      velocityTex,
      camera,
    ) as unknown as HasTextureNode;
    resolved = node.getTextureNode();
  }

  // --- Motion blur (velocity MRT) -----------------------------------------
  // Smears along per-pixel screen motion — the orbiting camera streaks the
  // background past the car. `velocity` is a vec2 motion-vector texture.
  let moving: ColorNode = resolved;
  if (quality.motionBlur) {
    moving = motionBlur(resolved, velocityTex.xy, int(MOTION_BLUR_SAMPLES));
  }

  // --- Depth of field ------------------------------------------------------
  // Bokeh falloff focused on the car. `dof` takes a viewZ node (negative view-
  // space depth) derived from the pass's depth attachment.
  let focused: ColorNode = moving;
  if (quality.dof) {
    const viewZ = scenePass.getViewZNode("depth");
    // `getTextureNode()` exists at runtime but is absent from
    // DepthOfFieldNode's r184 `.d.ts` — go through `unknown` to reach it.
    const node = dof(
      moving,
      viewZ,
      DOF_FOCUS_DISTANCE,
      DOF_FOCAL_LENGTH,
      DOF_BOKEH_SCALE,
    ) as unknown as HasTextureNode;
    focused = node.getTextureNode();
  }

  // --- Bloom + warm grade + vignette --------------------------------------
  const bloomPass = bloom(
    focused,
    quality.bloomStrength,
    quality.bloomRadius,
    0.8,
  );
  const withBloom: ColorNode = focused.add(bloomPass);

  // Warm/teal cinematic grade as the very last colour op (zero-asset TSL node,
  // not a 3D-LUT). `colorGrade` blends it in so it stays dialable.
  let finalColor: ColorNode = withBloom;
  if (quality.colorGrade > 0) {
    const graded = gradeColor(withBloom.rgb);
    finalColor = vec4(mix(withBloom.rgb, graded, quality.colorGrade), 1);
  }

  const vignette = smoothstep(0.85, 0.35, uv().sub(0.5).length());
  return finalColor.mul(vignette);
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
  const explicitUltra = useExplicitUltra();

  const pipeline = useMemo(() => {
    // Tone mapping is set on the renderer at construction (see world-canvas).
    const renderer = gl as unknown as THREE.WebGPURenderer;

    // `isWebGPUBackend` lives on the WebGPUBackend subclass; the typed
    // `renderer.backend` is the base `Backend`, so reach it structurally.
    const backend = renderer.backend as { isWebGPUBackend?: boolean };
    const isWebGPU = backend.isWebGPUBackend === true;

    // The universal floor — heat-shimmer (WebGPU only) → bloom → vignette — on
    // its own scene pass so it stands alone as the ultra fallback. Byte-for-byte
    // the previous floor chain; only lifted into a closure.
    const buildFloor = () => {
      const scenePass = pass(scene, camera);
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

      // Warm/teal cinematic grade — the hero arrival's signature look, now baked
      // into the reliable floor (it used to live only in the ultra branch, so a
      // capable visitor on the auto-floor default kept its grade). Scene-scoped
      // via the same opt-in set, so circuit / proving-ground stay ungraded and
      // pixel-identical. Zero asset bytes (a TSL node, not a 3D-LUT).
      const lit = base.add(bloomPass);
      const graded = sceneSupportsUltraPostFX(activeScene)
        ? vec4(mix(lit.rgb, gradeColor(lit.rgb), FLOOR_COLOR_GRADE), 1)
        : lit;

      const renderPipeline = new THREE.RenderPipeline(renderer);
      renderPipeline.outputNode = graded.mul(vignette);
      return renderPipeline;
    };

    // Heavy cinematic branch (WebGPU backend only, scenes that opt in, AND only
    // when the visitor EXPLICITLY asked for `?quality=ultra`): MRT +
    // SSGI/SSR/TRAA/motion-blur/DoF over the floor. Gating on `explicitUltra`
    // (not the strong-GPU auto-heuristic) keeps this still-being-tuned, over-
    // budget stack OFF the default first impression — capable visitors get the
    // reliable graded floor above; the full chain is a deliberate opt-in we
    // reintroduce one effect at a time (see plan P2/P6). The scene gate still
    // keeps circuit / proving-ground floor-only. If the graph throws while
    // building (a node/typings drift on this GPU/driver), fall to the floor
    // rather than brick the frame loop — reliability over fidelity.
    if (explicitUltra && isWebGPU && sceneSupportsUltraPostFX(activeScene)) {
      try {
        const scenePass = pass(scene, camera);
        const renderPipeline = new THREE.RenderPipeline(renderer);
        renderPipeline.outputNode = composeUltra(scenePass, camera, quality);
        return renderPipeline;
      } catch (error) {
        console.warn(
          "[world] ultra post-FX failed to build; using the bloom+vignette floor",
          error,
        );
        return buildFloor();
      }
    }

    return buildFloor();
  }, [gl, scene, camera, explicitUltra, quality, activeScene]);

  // A frame callback with priority > 0 takes the render loop over from R3F, so
  // the pipeline drives every frame. WebGPU compiles the TSL graph lazily on the
  // first render(); if that throws (or any later frame does), stop driving the
  // post-FX and fall back to a direct scene render so the world stays visible
  // instead of freezing or black-screening.
  const postFxFailed = useRef(false);
  useFrame((state) => {
    if (!postFxFailed.current) {
      try {
        pipeline.render();
        return;
      } catch (error) {
        postFxFailed.current = true;
        console.error(
          "[world] post-FX render failed; falling back to direct render",
          error,
        );
      }
    }
    (gl as unknown as THREE.WebGPURenderer).render(state.scene, state.camera);
  }, 1);

  useEffect(() => () => pipeline.dispose(), [pipeline]);

  return null;
}
