"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { pmremTexture } from "three/tsl";
import * as THREE from "three/webgpu";

import { useIsUltra } from "../../core/quality-provider";
import { HERO_CAR_BODY_FLAG } from "./car-materials";

/**
 * Per-frame {@link THREE.CubeCamera} car-paint reflections — Forza's actual
 * technique. Each frame we render the scene into a small cube map positioned at
 * the car and feed it (PMREM-convolved, so roughness blurs reflections
 * correctly) as the body paint's `envNode`, so the paint mirrors the SCENE
 * (road, sky, props) as the camera orbits — not just the static HDRI.
 *
 * ULTRA + WebGPU + hero only. The helper is mounted by `scenes/hero.tsx`, which
 * is already inside that gate, but it also no-ops defensively when the backend
 * is not WebGPU (the native `CubeRenderTarget` + a PMREM `envNode` are WebGPU
 * graph constructs; the WebGL2/2d floor keeps the static-HDRI reflection).
 *
 * Self-reflection guard: the body meshes (tagged via `HERO_CAR_BODY_FLAG` in
 * `car-materials.ts`) are hidden for the duration of the cube capture, so the
 * paint never reflects a frozen copy of itself. We capture at R3F priority 0 —
 * BEFORE the post-FX pipeline render (priority 1) consumes the frame.
 *
 * Cost: re-rendering 6 cube faces + a PMREM convolution every frame is real
 * work; it is deliberately scoped to the single ultra hero vignette. `size` and
 * the capture cadence are the dials to trade quality for frame budget.
 */

const CUBE_SIZE = 256;
const CUBE_CENTER = new THREE.Vector3(0, 0.9, 0); // ~roof height of the parked car

interface BodyMesh {
  mesh: THREE.Mesh;
  material: THREE.Material;
}

export function HeroCubeReflection() {
  const { gl, scene } = useThree();
  const isUltra = useIsUltra();

  // WebGPU-native cube target (NOT drei's `CubeCamera`, which allocates a
  // `WebGLCubeRenderTarget` — a WebGL-only class that the WebGPU backend can't
  // render into). HalfFloat keeps the golden-hour HDR range in the reflection.
  const { cubeCamera, cubeTarget, envNode } = useMemo(() => {
    const target = new THREE.CubeRenderTarget(CUBE_SIZE, {
      type: THREE.HalfFloatType,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    });
    const camera = new THREE.CubeCamera(0.3, 120, target);
    camera.position.copy(CUBE_CENTER);
    // A single shared PMREM node over the cube texture: assigning the SAME node
    // to every body material means one convolution per frame, not one per mesh.
    const env = pmremTexture(target.texture);
    return { cubeCamera: camera, cubeTarget: target, envNode: env };
  }, []);

  // Discovered lazily on the first capture (the car GLB streams in async, after
  // this component mounts) and refreshed if the tagged set changes.
  const bodies = useRef<BodyMesh[]>([]);
  const wired = useRef(false);

  useFrame(() => {
    // Ultra + WebGPU only: `isUltra` is already gated to the webgpu tier in
    // `lib/ultra.ts`, and the backend check below is the hard runtime guard
    // (the native cube target + PMREM envNode are WebGPU graph constructs).
    if (!isUltra) return;

    const renderer = gl as unknown as THREE.WebGPURenderer;
    const backend = renderer.backend as { isWebGPUBackend?: boolean };
    if (backend.isWebGPUBackend !== true) return;

    // (Re)collect the body meshes + assign the env map once they exist.
    if (!wired.current) {
      const found: BodyMesh[] = [];
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        const material = Array.isArray(mesh.material)
          ? mesh.material[0]
          : mesh.material;
        if (material?.userData?.[HERO_CAR_BODY_FLAG] === true) {
          found.push({ mesh, material });
        }
      });
      if (found.length > 0) {
        for (const { material } of found) {
          (material as THREE.MeshPhysicalNodeMaterial).envNode = envNode;
          material.needsUpdate = true;
        }
        bodies.current = found;
        wired.current = true;
      } else {
        return; // car not streamed in yet — try again next frame
      }
    }

    // Hide the body while capturing so the paint never mirrors itself.
    const hidden = bodies.current;
    for (const { mesh } of hidden) mesh.visible = false;
    cubeCamera.update(renderer, scene);
    for (const { mesh } of hidden) mesh.visible = true;
  }, 0);

  useEffect(
    () => () => {
      // Detach the env node from any wired materials before disposing the
      // target, so a lingering material reference can't sample a freed texture.
      for (const { material } of bodies.current) {
        (material as THREE.MeshPhysicalNodeMaterial).envNode = null;
        material.needsUpdate = true;
      }
      cubeTarget.dispose();
    },
    [cubeTarget],
  );

  return null;
}
