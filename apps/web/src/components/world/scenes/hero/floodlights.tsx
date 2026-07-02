"use client";

import { Instance, Instances } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three/webgpu";

import { HERO_TUNING } from "./tuning";

// Floodlight masts down the far (+x) barrier — the night race's WHY. A night
// circuit reads as a night circuit because of its lighting rig: repeated hot
// heads on poles (emissive → bloom halos), pools of warm light strobing the
// cars as the pack passes through them, and the matching glow comb baked into
// the night IBL (env-gradient.ts) so paint and wet asphalt reflect the rig on
// every tier. Masts rise from the wall top so their bases stay hidden behind
// the 1 m concrete barrier from the low harbour-side camera. Everything is
// procedural + instanced (2 draws) plus three shadowless SpotLights.

const Z_MIN = -54;
const Z_MAX = 54;
const MAST_SPACING = 12;

const MAST_X = 5.35; // on the wall line (track face x≈5.1, water starts 5.3)
const MAST_BASE_Y = 1.0; // wall top — the barrier hides the base
const MAST_TOP_Y = 8.2;
const HEAD_X = 4.75; // cantilevered over the track edge
const HEAD_Y = 8.0;
/** Head tilt about z, tipping the panel face down toward the racing line. */
const HEAD_TILT = 0.5;

/** The three light pools the pack strobes through along the straight. */
const POOL_ZS: readonly number[] = [-28, 0, 28];
const POOL_Y = 8.2;

function mastPositions(): number[] {
  const zs: number[] = [];
  for (let z = Z_MIN; z <= Z_MAX; z += MAST_SPACING) zs.push(z);
  return zs;
}

/**
 * Instanced floodlight masts + heads and the spot-light pools. Head emissive
 * and pool intensity are leva-dialable (`useHeroTuning`); the spots cast no
 * shadows (the moon owns the one shadow map) and are deliberately fewer than
 * the visual masts — three pools light the straight, the rest of the rig is
 * emissive set-dressing that blooms.
 */
export function Floodlights({
  headEmissive = HERO_TUNING.floodlightHeadEmissive,
  poolIntensity = HERO_TUNING.floodlightPoolIntensity,
}: {
  headEmissive?: number;
  poolIntensity?: number;
} = {}) {
  const zs = useMemo(() => mastPositions(), []);
  // SpotLight aims at its `target` Object3D, which must itself be in the scene
  // graph — mount each as a primitive parked on the racing line.
  const pools = useMemo(
    () =>
      POOL_ZS.map((z) => {
        const target = new THREE.Object3D();
        target.position.set(0, 0, z);
        return { z, target };
      }),
    [],
  );

  return (
    <>
      {/* Poles — dark steel, one InstancedMesh. */}
      <Instances limit={zs.length} castShadow receiveShadow>
        <boxGeometry args={[0.14, MAST_TOP_Y - MAST_BASE_Y, 0.14]} />
        <meshStandardMaterial color="#2e3238" roughness={0.6} metalness={0.7} />
        {zs.map((z, i) => (
          <Instance
            key={i}
            position={[MAST_X, (MAST_BASE_Y + MAST_TOP_Y) / 2, z]}
          />
        ))}
      </Instances>

      {/* Heads — hot emissive panels; bloom turns each into a floodlight halo. */}
      <Instances limit={zs.length}>
        <boxGeometry args={[0.55, 0.16, 0.34]} />
        <meshStandardMaterial
          color="#c9ccd2"
          roughness={0.3}
          metalness={0.2}
          emissive="#fff2d9"
          emissiveIntensity={headEmissive}
        />
        {zs.map((z, i) => (
          <Instance
            key={i}
            position={[HEAD_X, HEAD_Y, z]}
            rotation={[0, 0, HEAD_TILT]}
          />
        ))}
      </Instances>

      {/* Light pools — the alternating bright/dark rhythm down the straight. */}
      {pools.map(({ z, target }, i) => (
        <group key={i}>
          <primitive object={target} />
          <spotLight
            position={[HEAD_X - 0.1, POOL_Y, z]}
            target={target}
            intensity={poolIntensity}
            color="#ffedcf"
            angle={0.62}
            penumbra={0.65}
            distance={45}
            decay={1.8}
          />
        </group>
      ))}
    </>
  );
}
