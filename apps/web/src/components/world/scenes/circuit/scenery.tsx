"use client";

import { Instance, Instances, useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three/webgpu";

import { scatter } from "./scatter";

/** CC0 dark volcanic-rock PBR maps (ambientCG "Rock035" — see LICENSES.md). */
const ROCK_TEXTURES = {
  map: "/textures/ground/rock_color.jpg",
  normalMap: "/textures/ground/rock_normal.jpg",
  roughnessMap: "/textures/ground/rock_roughness.jpg",
} as const;

type RockMaps = Record<keyof typeof ROCK_TEXTURES, THREE.Texture>;

/**
 * Clone a freshly-loaded map set and configure the clones: repeat-wrap,
 * anisotropy, colour space (albedo sRGB, data maps linear), and the tile
 * `repeat` over the geometry's existing 0..1 UVs. Cloning keeps the loader
 * cache pristine and avoids mutating the hook's return value.
 */
function cloneMaps(textures: RockMaps, repeat: number): RockMaps {
  const configure = (src: THREE.Texture, srgb: boolean) => {
    const t = src.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
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
}

/** Land, sea, and an instanced cliff line along the coast (+x). */
export function Scenery() {
  const rocks = useMemo(
    () =>
      scatter(48, 1337, (r) => ({
        position: [
          62 + r.range(-4, 12),
          r.range(-2, 4),
          -82 + r.range(0, 96),
        ] as [number, number, number],
        rotation: [
          r.range(0, Math.PI),
          r.range(0, Math.PI * 2),
          r.range(0, Math.PI),
        ] as [number, number, number],
        scale: r.range(2.5, 7),
      })),
    [],
  );

  // One CC0 rock map set drives both the volcanic land plane and the cliff
  // instances, cloned per use so the ground can tile coarsely (~5.5 m/tile over
  // the 500 m plane) while the cliffs tile tight.
  const textures = useTexture(ROCK_TEXTURES);
  const ground = useMemo(() => cloneMaps(textures, 90), [textures]);
  const cliff = useMemo(() => cloneMaps(textures, 2), [textures]);

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, -35]}
        receiveShadow
      >
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial
          color="#5a4d3f"
          map={ground.map}
          normalMap={ground.normalMap}
          roughnessMap={ground.roughnessMap}
          roughness={1}
          metalness={0}
          normalScale={new THREE.Vector2(1, 1)}
          envMapIntensity={0.4}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[230, -6, -35]}>
        <planeGeometry args={[340, 540]} />
        <meshStandardMaterial
          color="#0b2735"
          roughness={0.18}
          metalness={0.65}
        />
      </mesh>

      <Instances limit={rocks.length}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#6b5d4d"
          map={cliff.map}
          normalMap={cliff.normalMap}
          roughnessMap={cliff.roughnessMap}
          roughness={1}
          metalness={0}
          flatShading
        />
        {rocks.map((rock, i) => (
          <Instance
            key={i}
            position={rock.position}
            rotation={rock.rotation}
            scale={rock.scale}
          />
        ))}
      </Instances>
    </>
  );
}

useTexture.preload(Object.values(ROCK_TEXTURES));
