import * as THREE from "three/webgpu";

import type { CarPart } from "./car-part";

/**
 * Physically-based node materials for the hero car. The body gets a clearcoat
 * car paint (high metalness + mid roughness under a near-perfect clearcoat), so
 * it reads as glossy and mirrors the HDRI on both the WebGPU and WebGL2
 * backends; wheels get a metallic rim + a rough tire.
 */
export const HERO_CAR_BODY_COLOR = "#9a1b1b";

function createCarPaintMaterial(): THREE.MeshPhysicalNodeMaterial {
  const material = new THREE.MeshPhysicalNodeMaterial();
  material.color = new THREE.Color(HERO_CAR_BODY_COLOR);
  material.metalness = 0.9;
  material.roughness = 0.38;
  material.clearcoat = 1;
  material.clearcoatRoughness = 0.06;
  material.envMapIntensity = 1.35;
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
  material.metalness = 0.6;
  material.roughness = 0.35;
  material.clearcoat = 0.6;
  material.clearcoatRoughness = 0.2;
  return material;
}

/** Build a fresh node material for a classified car part. */
export function createCarMaterial(part: CarPart): THREE.Material {
  switch (part) {
    case "body":
      return createCarPaintMaterial();
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
