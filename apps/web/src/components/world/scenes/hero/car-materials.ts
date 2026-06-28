import {
  add,
  mix,
  mul,
  mx_fractal_noise_vec3,
  normalize,
  normalView,
  positionLocal,
  vec3,
} from "three/tsl";
import * as THREE from "three/webgpu";

import type { CarPart } from "./car-part";

/**
 * Physically-based node materials for the hero car. The body gets a clearcoat
 * car paint (high metalness + low roughness under a near-perfect clearcoat),
 * so it reads as glossy and mirrors the HDRI on both the WebGPU and WebGL2
 * backends; wheels get a metallic rim + a rough tire.
 */
export const HERO_CAR_BODY_COLOR = "#9a1b1b";

/**
 * Marker on the body paint material's `userData`. The hero cube-reflection
 * helper (`scenes/hero/cube-reflection.tsx`) traverses the scene for materials
 * carrying this flag to (a) feed them the per-frame `CubeCamera` env map and
 * (b) hide them while the cube is captured (so the paint never reflects itself).
 * Keeping the seam in `userData` avoids exporting a brittle material registry.
 */
export const HERO_CAR_BODY_FLAG = "heroCarBody";

function createCarPaintMaterial(
  bodyColor: string,
): THREE.MeshPhysicalNodeMaterial {
  const material = new THREE.MeshPhysicalNodeMaterial();
  const base = new THREE.Color(bodyColor);
  material.color = base;
  // Near-mirror metal under a perfect clearcoat: a deep automotive 2-coat look.
  material.metalness = 0.95;
  material.roughness = 0.28;
  material.clearcoat = 1;
  material.clearcoatRoughness = 0.04;
  material.envMapIntensity = 1.5;

  // Metallic-flake sparkle: high-frequency fractal noise jitters the shading
  // normal so tiny facets catch the low sun and the env map as the camera
  // orbits — the glittery metallic-paint micro-detail. The noise is sampled in
  // LOCAL position (a fine, surface-anchored grain that twinkles as the view
  // moves), but the jitter is added to the VIEW-space normal, since `normalNode`
  // feeds the lighting in view space (`NodeMaterial.setupNormal`). The perfect
  // clearcoat on top keeps the macro surface glossy. `mx_fractal_noise_vec3`
  // is roughly in [-1,1].
  const flake = mx_fractal_noise_vec3(positionLocal.mul(420), 2, 2, 0.5);
  material.normalNode = normalize(add(normalView, mul(flake, vec3(0.06))));

  // A faint dual-tone clearcoat tint deepens the candy-paint richness without a
  // texture: lerp between a deeper and a hotter shade of the livery in the
  // flake's shadows/highlights — derived from `bodyColor`, so each car keeps the
  // candy look in its own hue.
  const lo = base.clone().multiplyScalar(0.78);
  const hi = base.clone().multiplyScalar(1.16);
  const candy = mix(
    vec3(lo.r, lo.g, lo.b),
    vec3(hi.r, hi.g, hi.b),
    flake.x.mul(0.5).add(0.5),
  );
  material.colorNode = candy;

  material.userData[HERO_CAR_BODY_FLAG] = true;
  return material;
}

function createRimMaterial(): THREE.MeshPhysicalNodeMaterial {
  const material = new THREE.MeshPhysicalNodeMaterial();
  material.color = new THREE.Color("#cfd3d9");
  material.metalness = 1;
  material.roughness = 0.26;
  material.envMapIntensity = 1.1;
  return material;
}

function createTireMaterial(): THREE.MeshStandardNodeMaterial {
  const material = new THREE.MeshStandardNodeMaterial();
  material.color = new THREE.Color("#0a0a0c");
  material.metalness = 0;
  material.roughness = 0.88;
  return material;
}

function createGlassMaterial(): THREE.MeshPhysicalNodeMaterial {
  const material = new THREE.MeshPhysicalNodeMaterial();
  material.color = new THREE.Color("#06080d");
  material.metalness = 0;
  material.roughness = 0.08;
  material.clearcoat = 1;
  material.clearcoatRoughness = 0.04;
  material.envMapIntensity = 1.2;
  return material;
}

function createHeadlightMaterial(): THREE.MeshStandardNodeMaterial {
  const material = new THREE.MeshStandardNodeMaterial();
  material.color = new THREE.Color("#dfe7ff");
  material.metalness = 0.1;
  material.roughness = 0.15;
  material.emissive = new THREE.Color("#fff1d6");
  material.emissiveIntensity = 0.6;
  return material;
}

function createTaillightMaterial(): THREE.MeshStandardNodeMaterial {
  const material = new THREE.MeshStandardNodeMaterial();
  material.color = new THREE.Color("#3a0606");
  material.metalness = 0.1;
  material.roughness = 0.2;
  material.emissive = new THREE.Color("#ff1f1f");
  material.emissiveIntensity = 0.7;
  return material;
}

function createTrimMaterial(): THREE.MeshPhysicalNodeMaterial {
  const material = new THREE.MeshPhysicalNodeMaterial();
  material.color = new THREE.Color("#15161a");
  material.metalness = 0.75;
  material.roughness = 0.3;
  material.clearcoat = 0.6;
  material.clearcoatRoughness = 0.2;
  // NB: no anisotropy. Brushed-metal anisotropy would stretch the specular into
  // a directional streak (the automotive-render tell), but three derives its
  // tangent frame from `uv` derivatives — and the placeholder GLB has no
  // TEXCOORD_0, so enabling it only logs `AttributeNode: uv not found` and
  // shades a broken tangent. Re-add once the real car (P4) ships with UVs.
  return material;
}

/** Build a fresh node material for a classified car part, in the given livery. */
export function createCarMaterial(
  part: CarPart,
  bodyColor: string = HERO_CAR_BODY_COLOR,
): THREE.Material {
  switch (part) {
    case "body":
      return createCarPaintMaterial(bodyColor);
    case "rim":
      return createRimMaterial();
    case "tire":
      return createTireMaterial();
    case "glass":
      return createGlassMaterial();
    case "headlight":
      return createHeadlightMaterial();
    case "taillight":
      return createTaillightMaterial();
    case "trim":
      return createTrimMaterial();
  }
}
