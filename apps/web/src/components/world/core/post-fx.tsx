"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { dof } from "three/addons/tsl/display/DepthOfFieldNode.js";
import { fxaa } from "three/addons/tsl/display/FXAANode.js";
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
  rand,
  renderOutput,
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
import { enablesCinematicPostFX, type QualitySettings } from "./quality";
import { useQuality } from "./quality-provider";
import { sceneSupportsUltraPostFX } from "./scene-capabilities";
import { type PostFxTuning, usePostFxTuning } from "./use-postfx-tuning";

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

const MOTION_BLUR_SAMPLES = 12;

// Warm/teal grade strength carried by the reliable FLOOR on cinematic scenes
// (per the `scene-capabilities.ts` opt-in; originally tuned on the retired hero
// vignette). The ultra branch grades at full `quality.colorGrade`; the floor
// uses a slightly gentler fixed amount so the DEFAULT arrival keeps the
// signature look without depending on the heavy stack. Scene-scoped —
// non-cinematic scenes stay ungraded.
const FLOOR_COLOR_GRADE = 0.8;

// Additive film grain on cinematic scenes: a signed per-pixel dither (animated
// by the shared `time` clock) that breaks up the 8-bit banding dark night
// gradients otherwise show, and adds the shot-on-a-camera texture.
// ADDITIVE by design — three's FilmNode only brightens (base + base·noise), so
// it vanishes exactly where banding lives, in the near-blacks. Same scene gate
// as the grade; non-cinematic scenes stay pixel-identical. Amount is a
// `usePostFxTuning` dial.

/** Signed grain node — `rand` hashes screen position + time into ±grain/2. */
function filmGrain(amount: number): Node<"float"> {
  return rand(screenUV.add(time)).sub(0.5).mul(amount) as Node<"float">;
}

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
  fx: PostFxTuning,
): ColorNode {
  // MRT trimmed to what the ENABLED passes actually consume — the AUTO_ULTRA
  // default (TRAA + DoF + grade) pays for output + velocity, not the full
  // five-attachment bandwidth the explicit stack needs.
  const needsNormal = quality.ssgi || quality.gtao || quality.ssr;
  const needsMaterialProps = quality.ssr;
  const needsVelocity = quality.traa || quality.motionBlur;
  scenePass.setMRT(
    mrt({
      output,
      ...(needsNormal ? { normal: normalView } : {}),
      ...(needsMaterialProps ? { metalness, roughness } : {}),
      ...(needsVelocity ? { velocity } : {}),
    }),
  );

  // SSGI + DoF are typed for a `PerspectiveCamera`; the world only ever mounts
  // a perspective camera, so narrow structurally (no `any`).
  const perspective = camera as THREE.PerspectiveCamera;

  const color = scenePass.getTextureNode("output");
  const depth = scenePass.getTextureNode("depth");
  const normalTex = needsNormal ? scenePass.getTextureNode("normal") : null;
  const velocityTex = needsVelocity
    ? scenePass.getTextureNode("velocity")
    : null;

  // --- Indirect lighting / AO ---------------------------------------------
  // SSGI evaluates to vec4(indirectGI.rgb, ao.a). The physically-correct
  // composite is `beauty * AO + GI`, which folds ambient occlusion in — so the
  // standalone GTAO pass is intentionally skipped under SSGI (the ULTRA preset
  // sets `gtao:false`) to avoid double-darkening. `gtao` stays the lighter
  // contact-AO path for an ultra config that disables SSGI.
  let lit: ColorNode = color;
  if (quality.ssgi && normalTex) {
    // `SSGINode extends TempNode<"vec4">`, so the node is itself a chainable
    // vec4 colour node — `.rgb`/`.a` read straight off it.
    const gi: ColorNode = ssgi(color, depth, normalTex, perspective);
    lit = color.mul(gi.a).add(gi.rgb);
  } else if (quality.gtao && normalTex) {
    const aoFactor = ao(depth, normalTex, camera).getTextureNode();
    lit = color.mul(vec4(vec3(aoFactor.r), 1));
  }

  // --- Screen-space reflections (glossy + metallic surfaces) ---------------
  // The node discards non-metallic fragments internally, so only glossy /
  // metallic surfaces reflect; add it over the lit color.
  let reflective: ColorNode = lit;
  if (quality.ssr && normalTex) {
    const reflections = ssr(
      lit,
      depth,
      normalTex,
      scenePass.getTextureNode("metalness"),
      scenePass.getTextureNode("roughness"),
      camera,
    ).getTextureNode();
    reflective = lit.add(reflections);
  }

  // --- Temporal AA ---------------------------------------------------------
  // TRAA resolves edge/temporal aliasing using history + the velocity MRT; it
  // jitters the camera projection internally (no camera-rig change needed).
  let resolved: ColorNode = reflective;
  if (quality.traa && velocityTex) {
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
  // Smears along per-pixel screen motion — a pan streaks the background past
  // fast-moving subjects. `velocity` is a vec2 motion-vector texture.
  let moving: ColorNode = resolved;
  if (quality.motionBlur && velocityTex) {
    moving = motionBlur(resolved, velocityTex.xy, int(MOTION_BLUR_SAMPLES));
  }

  // --- Depth of field ------------------------------------------------------
  // Bokeh falloff focused on the scene's subject (`usePostFxTuning` dials).
  // `dof` takes a viewZ node (negative view-space depth) from the depth
  // attachment.
  let focused: ColorNode = moving;
  if (quality.dof) {
    const viewZ = scenePass.getViewZNode("depth");
    // `getTextureNode()` exists at runtime but is absent from
    // DepthOfFieldNode's r184 `.d.ts` — go through `unknown` to reach it.
    const node = dof(
      moving,
      viewZ,
      fx.dofFocusDistance,
      fx.dofFocalLength,
      fx.dofBokehScale,
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

  // Grain rides after TRAA (so temporal accumulation can't smear it away) and
  // after the grade, right before the vignette. composeUltra is only built for
  // scenes that pass sceneSupportsUltraPostFX, so no extra gate is needed.
  const grained: ColorNode = vec4(
    finalColor.rgb.add(filmGrain(fx.filmGrain)),
    1,
  );

  const vignette = smoothstep(0.85, 0.35, uv().sub(0.5).length());
  return grained.mul(vignette);
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
  // Destructured to primitives so the pipeline memo can dep on VALUES — the
  // hook returns a fresh object per render, which would rebuild every frame.
  const {
    dofFocusDistance,
    dofFocalLength,
    dofBokehScale,
    filmGrain: grainAmount,
  } = usePostFxTuning();

  const pipeline = useMemo(() => {
    const fx: PostFxTuning = {
      dofFocusDistance,
      dofFocalLength,
      dofBokehScale,
      filmGrain: grainAmount,
    };
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

      // Warm/teal cinematic grade — the signature arrival look, baked into the
      // reliable floor (it used to live only in the ultra branch, so a capable
      // visitor on the auto-floor default kept its grade). Scene-scoped via the
      // same opt-in set, so non-cinematic scenes stay ungraded and
      // pixel-identical. Zero asset bytes (a TSL node, not a 3D-LUT).
      const lit = base.add(bloomPass);
      const cinematic = sceneSupportsUltraPostFX(activeScene);
      const graded = cinematic
        ? vec4(mix(lit.rgb, gradeColor(lit.rgb), FLOOR_COLOR_GRADE), 1)
        : lit;
      // Film grain rides the same cinematic-scene gate as the grade — it
      // dithers dark night gradients; other scenes stay untouched.
      const grained = cinematic
        ? vec4(graded.rgb.add(filmGrain(fx.filmGrain)), 1)
        : graded;

      const renderPipeline = new THREE.RenderPipeline(renderer);
      if (cinematic) {
        // FXAA needs sRGB/LDR input, so on cinematic scenes the floor applies
        // the output transform (tonemap + colour space) IN-GRAPH via
        // `renderOutput`, runs FXAA on the result, and switches the pipeline's
        // own output transform off so it isn't applied twice. This is the AA
        // for every floor visitor (the post pipeline has no MSAA; the heavy
        // branch gets TRAA instead). Other scenes keep the untouched default
        // path — pixel-identical to before.
        renderPipeline.outputColorTransform = false;
        renderPipeline.outputNode = fxaa(renderOutput(grained.mul(vignette)));
      } else {
        renderPipeline.outputNode = grained.mul(vignette);
      }
      return renderPipeline;
    };

    // Heavy cinematic branch (WebGPU backend only, scenes that opt in): MRT +
    // the passes the ACTIVE PRESET enables, over the floor. Preset-driven
    // (`enablesCinematicPostFX`) rather than ultra-flag-driven: the strong-GPU
    // auto-heuristic preset (AUTO_ULTRA) enables the verified-safe slice
    // (TRAA + DoF + grade) by DEFAULT, while the still-being-tuned heavy
    // passes (SSGI/SSR/motion-blur) exist only in the explicit `?quality=ultra`
    // preset. The scene gate still keeps non-opted-in scenes floor-only.
    // If the graph throws while building (a node/typings drift on this
    // GPU/driver), fall to the floor rather than brick the frame loop —
    // reliability over fidelity.
    if (
      enablesCinematicPostFX(quality) &&
      isWebGPU &&
      sceneSupportsUltraPostFX(activeScene)
    ) {
      try {
        const scenePass = pass(scene, camera);
        const renderPipeline = new THREE.RenderPipeline(renderer);
        renderPipeline.outputNode = composeUltra(
          scenePass,
          camera,
          quality,
          fx,
        );
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
  }, [
    gl,
    scene,
    camera,
    quality,
    activeScene,
    dofFocusDistance,
    dofFocalLength,
    dofBokehScale,
    grainAmount,
  ]);

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
