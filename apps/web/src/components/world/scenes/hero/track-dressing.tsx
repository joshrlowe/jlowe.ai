"use client";

import { Instance, Instances } from "@react-three/drei";
import { useMemo } from "react";

// The hero road is a straight ribbon 9 wide (x ∈ [-4.5, 4.5]) along z (road.tsx).
// The fixed hero-pass camera sits at x≈-8 looking ACROSS the road toward +x, so:
//   • kerbs hug BOTH edges (low — they never occlude the car),
//   • a concrete wall + steel Armco barrier line the FAR (+x) side only — the
//     backdrop behind the car — leaving the near (-x) camera side open so the
//     foreground stays clear of the shot.
// Everything is procedural + instanced (≈0 bytes, a handful of draw calls) and
// runs the full visible z-length so the car never drives "off the set".

// Runs to the corner blocks at z ≈ ±56 (monaco-buildings.tsx), so the barrier
// visually terminates INTO the corner and the set never ends mid-frame.
const ROAD_HALF_WIDTH = 4.5;
const Z_MIN = -55;
const Z_MAX = 55;

// --- Kerbs (red/white rumble strips) -------------------------------------
const KERB_SEG = 1.0; // stripe length along z
const KERB_WIDTH = 0.6; // x
const KERB_HEIGHT = 0.09; // slight extrusion catches the raking moonlight
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

// --- Monaco barrier (far +x side only): a concrete wall + a steel Armco rail
// flush to the track. No run-off — a street circuit is walled to the kerb.
const WALL_X = ROAD_HALF_WIDTH + 0.6; // 5.1 — concrete wall just off the kerb
const WALL_HEIGHT = 1.0;
const RAIL_X = ROAD_HALF_WIDTH + 0.32; // 4.82 — steel rail on the track face
const RAIL_Y = 0.42;
const POST_SPACING = 3;

function postPositions(): number[] {
  const zs: number[] = [];
  for (let z = Z_MIN + 1; z < Z_MAX; z += POST_SPACING) zs.push(z);
  return zs;
}

/**
 * Procedural Monaco-style barrier set-dressing for the fixed hero-pass camera:
 * red/white kerbs on both road edges, plus a concrete wall + steel Armco flush
 * to the track on the far (+x) side (a street circuit is walled to the kerb, no
 * run-off). No textures; instanced so it stays a few draws.
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

      {/* Concrete wall — the Monaco barrier, flush behind the kerb. */}
      <mesh position={[WALL_X, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.45, WALL_HEIGHT, Z_MAX - Z_MIN]} />
        <meshStandardMaterial color="#c9c3b6" roughness={0.92} metalness={0} />
      </mesh>

      {/* Steel Armco rail on the track-facing side of the wall. */}
      <mesh position={[RAIL_X, RAIL_Y, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 0.42, Z_MAX - Z_MIN]} />
        <meshStandardMaterial
          color="#c8ccd0"
          roughness={0.45}
          metalness={0.5}
        />
      </mesh>

      {/* Barrier posts (track-facing). */}
      <Instances limit={posts.length} castShadow receiveShadow>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
        <meshStandardMaterial color="#5f6368" roughness={0.7} metalness={0.3} />
        {posts.map((z, i) => (
          <Instance key={i} position={[RAIL_X, 0.3, z]} />
        ))}
      </Instances>
    </>
  );
}
