"use client";

import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three/webgpu";

const ROAD_TEXTURES = [
  "/hero/road/asphalt_albedo.jpg",
  "/hero/road/asphalt_normal.jpg",
  "/hero/road/asphalt_roughness.jpg",
] as const;

const ROAD_WIDTH = 9;
const ROAD_LENGTH = 70;

/**
 * A short asphalt road segment receding along +/-z, with a separate glossy
 * "wet" zone reserved for the later wet-road SSR pass, sitting on a wide dark
 * ground plane. PBR asphalt textures tile along the road length.
 */
export function HeroRoad() {
  const [rawAlbedo, rawNormal, rawRoughness] = useLoader(THREE.TextureLoader, [
    ...ROAD_TEXTURES,
  ]) as [THREE.Texture, THREE.Texture, THREE.Texture];

  // Clone before configuring — mutating a loader's cached texture is unsafe
  // (and disallowed); each clone owns its tiling/colour-space + disposal.
  const [albedo, normal, roughness] = useMemo(() => {
    const tile = (src: THREE.Texture, colorSpace: string): THREE.Texture => {
      const tex = src.clone();
      tex.colorSpace = colorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 14);
      tex.needsUpdate = true;
      return tex;
    };
    return [
      tile(rawAlbedo, THREE.SRGBColorSpace),
      tile(rawNormal, THREE.NoColorSpace),
      tile(rawRoughness, THREE.NoColorSpace),
    ];
  }, [rawAlbedo, rawNormal, rawRoughness]);

  useEffect(
    () => () => {
      albedo.dispose();
      normal.dispose();
      roughness.dispose();
    },
    [albedo, normal, roughness],
  );

  return (
    <>
      {/* ground plane — distinct, darker, surrounds the road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial
          color="#15110d"
          roughness={0.96}
          metalness={0.04}
        />
      </mesh>

      {/* asphalt road ribbon */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
        <meshStandardMaterial
          map={albedo}
          normalMap={normal}
          roughnessMap={roughness}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* glossy "wet" zone — low roughness, reserved for later SSR */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 11]}
        receiveShadow
      >
        <planeGeometry args={[ROAD_WIDTH, 16]} />
        <meshStandardMaterial
          color="#0b0b0f"
          roughness={0.08}
          metalness={0.5}
        />
      </mesh>
    </>
  );
}
