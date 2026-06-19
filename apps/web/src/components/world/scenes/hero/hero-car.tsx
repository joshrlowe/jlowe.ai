"use client";

import { useEffect, useMemo } from "react";
import type { Material, Mesh, Object3D } from "three/webgpu";

import { createCarMaterial } from "./car-materials";
import { classifyCarPart, isWheelDescendant } from "./car-part";
import { useGltfScene } from "./hero-model";

const CAR_URL = "/assets/car/sports-car.glb";

/**
 * The curated CC0 sports car, the prominent foreground subject. Each source
 * surface is re-skinned with a physically-based node material by intent: a
 * clearcoat car paint on the body, metallic rims, rough tires, dark glass, and
 * emissive lights — so it reads as glossy and reflects the golden-hour HDRI on
 * both backends. Faces +z, sat on the road at the origin; every mesh casts and
 * receives the sun's soft shadow.
 */
export function HeroCar() {
  const scene = useGltfScene(CAR_URL);

  const { object, materials } = useMemo(() => {
    const clone = scene.clone(true) as Object3D;
    const created: Material[] = [];
    clone.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const source = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as
        | Material
        | undefined;
      const part = classifyCarPart(source?.name ?? "", isWheelDescendant(mesh));
      const material = createCarMaterial(part);
      mesh.material = material;
      created.push(material);
    });
    return { object: clone, materials: created };
  }, [scene]);

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);

  return <primitive object={object} position={[0, 0, 0]} rotation={[0, Math.PI, 0]} />;
}
