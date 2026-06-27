"use client";

import { Instance, Instances } from "@react-three/drei";
import { useMemo } from "react";

// The hero road is a straight ribbon 9 wide (x ∈ [-4.5, 4.5]) along z (road.tsx).
// The fixed hero-pass camera sits at x≈-8 looking ACROSS the road toward +x, so:
//   • kerbs hug BOTH edges (low — they never occlude the car),
//   • the Armco barrier + gravel run-off live on the FAR (+x) side only — the
//     backdrop behind the car — leaving the near (-x) camera side open so the
//     foreground stays clear of the shot.
// Everything is procedural + instanced (≈0 bytes, a handful of draw calls) and
// runs the full visible z-length so the car never drives "off the set".

const ROAD_HALF_WIDTH = 4.5;
const Z_MIN = -34;
const Z_MAX = 34;

// --- Kerbs (red/white rumble strips) -------------------------------------
const KERB_SEG = 1.0; // stripe length along z
const KERB_WIDTH = 0.6; // x
const KERB_HEIGHT = 0.09; // slight extrusion catches the raking golden sun
const KERB_X = ROAD_HALF_WIDTH - 0.1; // just inside each road edge
const KERB_RED = "#b3271e";
const KERB_WHITE = "#dde3e6";

interface KerbSeg {
  z: number;
  color: string;
}

function kerbSegments(): KerbSeg[] {
  const segs: KerbSeg[] = [];
  let i = 0;
  for (let z = Z_MIN; z < Z_MAX; z += KERB_SEG, i += 1) {
    segs.push({
      z: z + KERB_SEG / 2,
      color: i % 2 === 0 ? KERB_RED : KERB_WHITE,
    });
  }
  return segs;
}

// --- Armco barrier (far +x backdrop side only) ---------------------------
const BARRIER_X = ROAD_HALF_WIDTH + 0.7;
const RAIL_Y = 0.5;
const POST_SPACING = 3;

function postPositions(): number[] {
  const zs: number[] = [];
  for (let z = Z_MIN + 1; z < Z_MAX; z += POST_SPACING) zs.push(z);
  return zs;
}

/**
 * Procedural F1-track set-dressing for the fixed hero-pass camera: red/white
 * kerbs on both road edges, plus an Armco barrier + a gravel run-off strip on
 * the far (+x) backdrop side. No textures; instanced so it stays a few draws.
 */
export function TrackDressing() {
  const kerbs = useMemo(() => kerbSegments(), []);
  const posts = useMemo(() => postPositions(), []);

  return (
    <>
      {/* Kerbs — one InstancedMesh for BOTH edges (per-instance colour). */}
      <Instances limit={kerbs.length * 2} castShadow receiveShadow>
        <boxGeometry args={[KERB_WIDTH, KERB_HEIGHT, KERB_SEG]} />
        <meshStandardMaterial roughness={0.7} metalness={0} />
        {kerbs.map((s, i) => (
          <Instance
            key={`r${i}`}
            position={[KERB_X, KERB_HEIGHT / 2, s.z]}
            color={s.color}
          />
        ))}
        {kerbs.map((s, i) => (
          <Instance
            key={`l${i}`}
            position={[-KERB_X, KERB_HEIGHT / 2, s.z]}
            color={s.color}
          />
        ))}
      </Instances>

      {/* Armco rail (one long box) on the far side. */}
      <mesh position={[BARRIER_X, RAIL_Y, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.14, 0.46, Z_MAX - Z_MIN]} />
        <meshStandardMaterial color="#c8ccd0" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Barrier posts. */}
      <Instances limit={posts.length} castShadow receiveShadow>
        <boxGeometry args={[0.12, 0.72, 0.12]} />
        <meshStandardMaterial color="#6a6e73" roughness={0.7} metalness={0.3} />
        {posts.map((z, i) => (
          <Instance key={i} position={[BARRIER_X, 0.36, z]} />
        ))}
      </Instances>

      {/* Gravel run-off strip on the +x verge, beyond the barrier. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[BARRIER_X + 4, 0.006, 0]}
        receiveShadow
      >
        <planeGeometry args={[8, Z_MAX - Z_MIN]} />
        <meshStandardMaterial color="#9a8a6a" roughness={0.97} metalness={0} />
      </mesh>
    </>
  );
}
