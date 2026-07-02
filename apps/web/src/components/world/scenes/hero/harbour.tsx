"use client";

import { Instance, Instances } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import {
  floor,
  fract,
  positionWorld,
  sin,
  smoothstep,
  step,
  time,
  vec3,
} from "three/tsl";
import * as THREE from "three/webgpu";

import { scatter } from "../circuit/scatter";
import { HERO_TUNING } from "./tuning";

// The Monaco harbour-front on the far (+x) backdrop side, between the track
// barrier and the city tiers (monaco-buildings pushed back to sit behind it):
// a glossy sunset-teal water plane with a row of moored yachts — white hulls,
// superstructures, and a forest of masts that tower over the quay so the harbour
// reads even from the low hero-pass camera. All procedural + instanced (zero
// bytes; 4 draws: water + hulls + cabins + masts). Runs the full visible
// z-length so the waterfront never ends mid-shot.

const Z_MIN = -55;
const Z_MAX = 55;

// Water sits just above the dark ground plane (road.tsx), in the band opened up
// between the +x barrier (x≈5.1) and the pushed-back city (x≈13+).
const WATER_Y = 0.06;
const WATER_X_MIN = 5.3;
const WATER_X_MAX = 12.8;

// Moored band: hull centres sit in the near half of the water so masts rise in
// front of the city. Hulls run parallel to the quay (length along z).
const YACHT_COUNT = 11;
const YACHT_SEED = 53;
const YACHT_X_MIN = 6.6;
const YACHT_X_MAX = 9.2;

interface Yacht {
  /** hull box: world position + [beam, height, length] scale + livery */
  hull: { position: [number, number, number]; scale: [number, number, number] };
  hullColor: string;
  /** superstructure box atop the deck, set toward the bow */
  cabin: {
    position: [number, number, number];
    scale: [number, number, number];
  };
  /** thin tall mast amidships */
  mast: { position: [number, number, number]; scale: [number, number, number] };
}

// Mostly white/cream fibreglass with the occasional deep navy or charcoal hull.
const HULL_COLORS = [
  "#f3f0ea",
  "#eceae3",
  "#f6f3ec",
  "#e7e3d8",
  "#1d2a44",
  "#f3f0ea",
  "#2a2f36",
];

function buildYachts(): Yacht[] {
  return scatter(YACHT_COUNT, YACHT_SEED, (r, i) => {
    const beam = r.range(2.4, 3.2);
    const hullH = r.range(1.1, 1.5);
    const length = r.range(7, 12);
    const x = r.range(YACHT_X_MIN, YACHT_X_MAX);
    // Even z-spacing down the quay with a little jitter (deterministic).
    const span = (Z_MAX - Z_MIN) / YACHT_COUNT;
    const z = Z_MIN + (i + 0.5) * span + r.range(-1.4, 1.4);

    // Hull floats with its boot-line just above the water.
    const hullCenterY = WATER_Y + hullH / 2 - 0.3;
    const deckTop = hullCenterY + hullH / 2;

    const cabinH = r.range(1.2, 1.9);
    const cabinLen = length * r.range(0.4, 0.5);
    // Bias the superstructure toward the bow (−z) end of the deck.
    const cabinZ = z - length * 0.12;

    const mastH = r.range(8, 13);
    const mastZ = z + length * r.range(-0.1, 0.1);

    const hullColor = HULL_COLORS[i % HULL_COLORS.length] ?? "#f3f0ea";

    return {
      hull: {
        position: [x, hullCenterY, z],
        scale: [beam, hullH, length],
      },
      hullColor,
      cabin: {
        position: [x, deckTop + cabinH / 2, cabinZ],
        scale: [beam * 0.66, cabinH, cabinLen],
      },
      mast: {
        position: [x, deckTop + mastH / 2, mastZ],
        scale: [0.09, mastH, 0.09],
      },
    };
  });
}

/**
 * Water material with FAKE mirrored window streaks. A glossy StandardMaterial
 * only reflects the ENVIRONMENT — at night that's a near-black sky, so the
 * harbour reads as a void between the quay and the glowing city (the classic
 * fake-night tell; a real planar reflector here would re-render the scene and
 * blow the frame budget). Instead the emissive carries the Port-Hercule money
 * shot directly: warm vertical streaks under the city, column-aligned with the
 * ACTUAL lit windows by reusing monaco-buildings' exact per-cell hash
 * (floor(z/1.3)·12.99 + row·78.23 → fract(sin·43758.5), same lit-ratio
 * threshold), stretched toward the camera, rippled by the shared `time` clock,
 * and strongest at the far band under the facades. Zero bytes, deterministic.
 */
const WIN_W = 1.3; // must match monaco-buildings.tsx WIN_W
const STREAK_ROWS = 3; // ground-floor rows that drive each column's brightness

function buildWaterMaterial(
  streakIntensity: number,
  windowLitRatio: number,
): THREE.MeshStandardNodeMaterial {
  const material = new THREE.MeshStandardNodeMaterial();
  material.color = new THREE.Color("#143b3f");
  material.roughness = 0.14;
  material.metalness = 0.6;

  if (streakIntensity > 0) {
    const x = positionWorld.x;
    // Ripple wobble bends the streak columns like a live water surface.
    const wobble = sin(x.mul(2.6).add(time.mul(1.2))).mul(0.09);
    const z = positionWorld.z.add(wobble);

    const col = floor(z.div(WIN_W));
    const gz = fract(z.div(WIN_W));
    // Streak core within the column, soft-edged.
    const columnMask = smoothstep(0.16, 0.42, gz).mul(
      smoothstep(0.84, 0.58, gz),
    );

    // Column brightness = how many of the facade's lowest window rows are lit
    // (same hash + threshold as the buildings, so streaks sit under lit panes).
    let litSum = step(
      1 - windowLitRatio,
      fract(sin(col.mul(12.99)).mul(43758.5)),
    );
    for (let row = 1; row < STREAK_ROWS; row++) {
      litSum = litSum.add(
        step(
          1 - windowLitRatio,
          fract(sin(col.mul(12.99).add(row * 78.23)).mul(43758.5)),
        ),
      );
    }
    const brightness = litSum.div(STREAK_ROWS);

    // Strongest in the far band right under the facades, fading toward the
    // quay; shimmer breaks the streaks up so they read as water, not paint.
    const fall = smoothstep(5.6, 12.4, x);
    const shimmer = sin(x.mul(9).add(time.mul(2.1)).add(col.mul(4.7)))
      .mul(0.35)
      .add(0.65);

    material.emissiveNode = vec3(1.0, 0.78, 0.45)
      .mul(brightness)
      .mul(columnMask)
      .mul(fall)
      .mul(shimmer)
      .mul(streakIntensity);
  }

  return material;
}

/**
 * The Monaco harbour: a glossy water plane + a moored yacht row. Reused glossy
 * (not a live reflector) by intent — a second planar reflector on the ultra path
 * would re-render the whole scene and blow the draw/FPS budget the plan flags,
 * and the low camera sees little of the flat water anyway. At night the fake
 * window-streak emissive (above) carries the water; the masts + superstructures
 * carry the harbour read over the quay.
 */
export function Harbour({
  cabinEmissive = HERO_TUNING.cabinEmissive,
  waterStreakIntensity = HERO_TUNING.waterStreakIntensity,
  windowLitRatio = HERO_TUNING.windowLitRatio,
}: {
  /** Yacht superstructure warm glow — leva-dialable via `useHeroTuning`. */
  cabinEmissive?: number;
  /** Fake mirrored window-streak strength on the water. 0 disables. */
  waterStreakIntensity?: number;
  /** Must track the buildings' lit ratio so streaks match lit panes. */
  windowLitRatio?: number;
} = {}) {
  const yachts = buildYachts();
  const waterMaterial = useMemo(
    () => buildWaterMaterial(waterStreakIntensity, windowLitRatio),
    [waterStreakIntensity, windowLitRatio],
  );
  useEffect(() => () => waterMaterial.dispose(), [waterMaterial]);

  return (
    <>
      {/* Harbour water — glossy, with the fake city-light streaks at night. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(WATER_X_MIN + WATER_X_MAX) / 2, WATER_Y, 0]}
        material={waterMaterial}
        receiveShadow
      >
        <planeGeometry args={[WATER_X_MAX - WATER_X_MIN, Z_MAX - Z_MIN]} />
      </mesh>

      {/* Hulls — one InstancedMesh, per-instance livery. */}
      <Instances limit={yachts.length} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.32} metalness={0.1} />
        {yachts.map((y, i) => (
          <Instance
            key={i}
            position={y.hull.position}
            scale={y.hull.scale}
            color={y.hullColor}
          />
        ))}
      </Instances>

      {/* Superstructures — off-white cabins, lit warm for the night harbour. */}
      <Instances limit={yachts.length} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#dfe2e1"
          roughness={0.5}
          metalness={0.05}
          emissive="#ffd9a0"
          emissiveIntensity={cabinEmissive}
        />
        {yachts.map((y, i) => (
          <Instance key={i} position={y.cabin.position} scale={y.cabin.scale} />
        ))}
      </Instances>

      {/* Masts — the forest of poles that signals "harbour" over the quay. */}
      <Instances limit={yachts.length} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#9aa0a6" roughness={0.5} metalness={0.4} />
        {yachts.map((y, i) => (
          <Instance key={i} position={y.mast.position} scale={y.mast.scale} />
        ))}
      </Instances>
    </>
  );
}
