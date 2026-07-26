"use client";

import { useMemo } from "react";
import * as THREE from "three/webgpu";

import { useKtx2Textures } from "./use-ktx2-textures";

/**
 * CC0 tarmac PBR maps (ambientCG "Asphalt002" — see LICENSES.md), compressed to
 * KTX2 (Basis Universal) by the asset pipeline and served content-hashed from
 * /public/assets. Filenames come from apps/web/public/assets/manifest.json;
 * rebuilding the pipeline re-hashes them, so update these URLs alongside it.
 */
const ROAD_TEXTURES = {
  map: "/assets/asphalt_color.23a92b85fc43bbdf.ktx2",
  normalMap: "/assets/asphalt_normal.7b4d794e52661443.ktx2",
  roughnessMap: "/assets/asphalt_roughness.80d5eef49e870ef9.ktx2",
} as const;

/**
 * The road ribbon (one draw call). Geometry is built once in CircuitScene and
 * carries UVs (U across the width, V along the cumulative length) so these
 * tarmac maps tile at a constant physical size around the whole loop. Loaded as
 * KTX2 through R3F's loading manager (the pre-flight bar tracks them, same as
 * the HDRI). Tiling is baked into the geometry UVs, so each texture stays at
 * repeat (1, -1) with RepeatWrapping — the negative V reproduces the old JPG's
 * `flipY: true` sampling, which compressed KTX2 (always `flipY: false`) can't do
 * on the CPU, so orientation and normal-map lighting match the pre-swap look.
 */
export function Track({ geometry }: { geometry: THREE.BufferGeometry }) {
  const textures = useKtx2Textures(ROAD_TEXTURES);

  // Clone before configuring — the loader caches by URL, and the returned
  // textures must not be mutated in place (same pattern as core/hdri-sky).
  const { map, normalMap, roughnessMap } = useMemo(() => {
    const configure = (src: THREE.Texture, srgb: boolean) => {
      const t = src.clone();
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      // Negative V compensates for KTX2's forced flipY=false (see docstring).
      t.repeat.set(1, -1);
      t.anisotropy = 8;
      // KTX2 carries its colour space in the DFD, but set it explicitly to match
      // the pipeline's encoding (colour sRGB, data maps linear) and stay robust.
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
