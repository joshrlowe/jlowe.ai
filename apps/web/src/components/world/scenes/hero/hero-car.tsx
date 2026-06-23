"use client";

import { type RefObject, useEffect, useMemo } from "react";
import type { Material, Mesh, Object3D } from "three/webgpu";

import { createCarMaterial } from "./car-materials";
import { classifyCarPart, isWheelDescendant } from "./car-part";
import { useGltfScene } from "./hero-model";

const CAR_URL = "/hero/car/f1-car.glb";

/**
 * Uniform scale applied to the source GLB. The model is authored ~4.35 units
 * long (nose-to-rear-wing); 0.9 brings it to ≈3.9 m — matching the on-screen
 * footprint of the previous sports car and a believable open-wheel length.
 */
const SCALE = 0.9;

/**
 * Vertical lift so the tires rest on the ground plane. The source origin sits
 * 0.372 units above the tire contact patch; scaled, that is ≈0.335. (Eyeballed
 * from the model's bbox — confirm in-browser that the contact patch kisses y=0.)
 */
const LIFT = 0.372 * SCALE;

/**
 * The model's intrinsic yaw offset: its nose is authored toward local −x, so a
 * +90° turn about y points it down +z. It's applied to the car primitive; the
 * wrapping node (driven by the scene) adds the path-following yaw on top, so at
 * node-yaw 0 the nose faces +z (the +z straight of the drive loop). car-rail.ts.
 */
const HEADING_Y = Math.PI / 2;

/**
 * The curated CC0 open-wheel "Racing car" (an F1-style single-seater), the
 * prominent foreground subject. The source authors its whole body as one mesh
 * of five flat-coloured materials; each surface is re-skinned with a
 * physically-based node material by intent — a clearcoat car paint on the red
 * bodywork, metallic rims, rough tires, dark glass on the cockpit, and dark
 * metallic trim on the wing accents — so it reads as glossy and reflects the
 * golden-hour HDRI on both backends. The wheels are part of the single body
 * mesh (not separable nodes), so the whole car renders as one object; every
 * mesh casts and receives the sun's soft shadow.
 *
 * The car rides an `<object3D>` node that the scene drives along the closed loop
 * each frame (see hero.tsx + car-rail.ts); the cinematic camera chases the same
 * node. Without a `driveRef` it renders parked at the origin.
 */
export function HeroCar({
  driveRef,
}: {
  driveRef?: RefObject<Object3D | null>;
}) {
  const scene = useGltfScene(CAR_URL);

  const { object, materials } = useMemo(() => {
    const clone = scene.clone(true) as Object3D;
    const created: Material[] = [];
    clone.traverse((child) => {
      const mesh = child as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const source = (
        Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
      ) as Material | undefined;
      const part = classifyCarPart(source?.name ?? "", isWheelDescendant(mesh));
      const material = createCarMaterial(part);
      mesh.material = material;
      created.push(material);
    });
    return { object: clone, materials: created };
  }, [scene]);

  useEffect(
    () => () => materials.forEach((material) => material.dispose()),
    [materials],
  );

  return (
    <object3D ref={driveRef}>
      <primitive
        object={object}
        position={[0, LIFT, 0]}
        rotation={[0, HEADING_Y, 0]}
        scale={SCALE}
      />
    </object3D>
  );
}
