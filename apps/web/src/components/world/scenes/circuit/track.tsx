"use client";

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three/webgpu";

/** CC0 tarmac PBR maps (ambientCG "Asphalt002" — see LICENSES.md). */
const ROAD_TEXTURES = {
  map: "/textures/road/asphalt_color.jpg",
  normalMap: "/textures/road/asphalt_normal.jpg",
  roughnessMap: "/textures/road/asphalt_roughness.jpg",
} as const;

/**
 * The road ribbon (one draw call). Geometry is built once in CircuitScene and
 * carries UVs (U across the width, V along the cumulative length) so these
 * tarmac maps tile at a constant physical size around the whole loop. Loaded
 * through R3F's loading manager (the pre-flight bar tracks them, same as the
 * HDRI). Tiling is baked into the geometry UVs, so each texture stays at
 * repeat (1,1) with RepeatWrapping.
 */
export function Track({ geometry }: { geometry: THREE.BufferGeometry }) {
  const textures = useTexture(ROAD_TEXTURES);

  // Clone before configuring — the loader caches by URL, and the returned
  // textures must not be mutated in place (same pattern as core/hdri-sky).
  const { map, normalMap, roughnessMap } = useMemo(() => {
    const configure = (src: THREE.Texture, srgb: boolean) => {
      const t = src.clone();
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.needsUpdate = true;
      return t;
    };
    return {
      map: configure(textures.map, true),
      normalMap: configure(textures.normalMap, false),
      roughnessMap: configure(textures.roughnessMap, false),
    };
  }, [textures]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        map={map}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        roughness={1}
        metalness={0}
        normalScale={new THREE.Vector2(0.8, 0.8)}
        envMapIntensity={0.35}
      />
    </mesh>
  );
}

useTexture.preload(Object.values(ROAD_TEXTURES));
