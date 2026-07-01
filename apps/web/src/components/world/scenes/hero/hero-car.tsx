"use client";

import { type RefObject, useEffect, useMemo } from "react";
import type { Material, Mesh, Object3D } from "three/webgpu";

import {
  type CarPaintTuning,
  createCarMaterial,
  HERO_CAR_BODY_COLOR,
} from "./car-materials";
import { classifyCarPart, isWheelDescendant } from "./car-part";
import { useGltfScene } from "./hero-model";
import { HERO_TUNING } from "./tuning";

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

/** Rain-light block dimensions (m) — the slim vertical LED bar on the rear
 * crash structure. */
const RAIN_LIGHT_SIZE: readonly [number, number, number] = [0.09, 0.14, 0.04];

/**
 * The curated CC0 open-wheel "Racing car" (an F1-style single-seater), the
 * prominent foreground subject. The source authors its whole body as one mesh
 * of five flat-coloured materials; each surface is re-skinned with a
 * physically-based node material by intent — a clearcoat car paint on the
 * bodywork, metallic rims, rough tires, dark glass on the cockpit, and dark
 * metallic trim on the wing accents — so it reads as glossy on both backends.
 * The wheels are part of the single body mesh (not separable nodes), so the
 * whole car renders as one object; every mesh casts and receives the moon's
 * soft shadow.
 *
 * A formula car carries no headlights; its night signature is the FIA RAIN
 * LIGHT — the red LED block on the rear crash structure — so each car gets one
 * as a small emissive mesh (position/intensity leva-dialable) that blooms into
 * the trailing red streak of the pack.
 *
 * The car rides an `<object3D>` node that the scene drives along the closed loop
 * each frame (see hero.tsx + car-rail.ts); in that node's space the nose is +z,
 * so the rain light sits at −z on the tail. Without a `driveRef` it renders
 * parked at the origin.
 */
export function HeroCar({
  driveRef,
  bodyColor = HERO_CAR_BODY_COLOR,
  bodyMetalness = HERO_TUNING.bodyMetalness,
  bodyRoughness = HERO_TUNING.bodyRoughness,
  bodyEnvMapIntensity = HERO_TUNING.bodyEnvMapIntensity,
  rainLightEmissive = HERO_TUNING.rainLightEmissive,
  rainLightY = HERO_TUNING.rainLightY,
  rainLightZ = HERO_TUNING.rainLightZ,
}: {
  driveRef?: RefObject<Object3D | null>;
  /** Body livery colour — lets a multi-car grid run distinct liveries. */
  bodyColor?: string;
  bodyMetalness?: number;
  bodyRoughness?: number;
  bodyEnvMapIntensity?: number;
  rainLightEmissive?: number;
  rainLightY?: number;
  rainLightZ?: number;
}) {
  const scene = useGltfScene(CAR_URL);

  const { object, materials } = useMemo(() => {
    const paint: CarPaintTuning = {
      metalness: bodyMetalness,
      roughness: bodyRoughness,
      envMapIntensity: bodyEnvMapIntensity,
    };
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
      const material = createCarMaterial(part, bodyColor, paint);
      mesh.material = material;
      created.push(material);
    });
    return { object: clone, materials: created };
  }, [scene, bodyColor, bodyMetalness, bodyRoughness, bodyEnvMapIntensity]);

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
      {/* FIA rain light — hot red emissive block on the tail; bloom turns it
          into the pack's trailing night signature. */}
      <mesh position={[0, rainLightY, rainLightZ]}>
        <boxGeometry args={[...RAIN_LIGHT_SIZE]} />
        <meshStandardMaterial
          color="#2a0505"
          roughness={0.4}
          metalness={0}
          emissive="#ff2222"
          emissiveIntensity={rainLightEmissive}
        />
      </mesh>
    </object3D>
  );
}
