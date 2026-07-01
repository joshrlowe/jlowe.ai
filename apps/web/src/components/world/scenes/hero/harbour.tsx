"use client";

import { Instance, Instances } from "@react-three/drei";

import { scatter } from "../circuit/scatter";

// The Monaco harbour-front on the far (+x) backdrop side, between the track
// barrier and the city tiers (monaco-buildings pushed back to sit behind it):
// a glossy sunset-teal water plane with a row of moored yachts — white hulls,
// superstructures, and a forest of masts that tower over the quay so the harbour
// reads even from the low hero-pass camera. All procedural + instanced (zero
// bytes; 4 draws: water + hulls + cabins + masts). Runs the full visible
// z-length so the waterfront never ends mid-shot.

const Z_MIN = -32;
const Z_MAX = 32;

// Water sits just above the dark ground plane (road.tsx), in the band opened up
// between the +x barrier (x≈5.1) and the pushed-back city (x≈13+).
const WATER_Y = 0.06;
const WATER_X_MIN = 5.3;
const WATER_X_MAX = 12.8;

// Moored band: hull centres sit in the near half of the water so masts rise in
// front of the city. Hulls run parallel to the quay (length along z).
const YACHT_COUNT = 7;
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
 * The Monaco harbour: a glossy water plane + a moored yacht row. Reused glossy
 * (not a live reflector) by intent — a second planar reflector on the ultra path
 * would re-render the whole scene and blow the draw/FPS budget the plan flags,
 * and the low camera sees little of the flat water anyway. The water still
 * mirrors the golden HDRI via its low roughness, and the yacht hulls catch the
 * raking sun; the masts + superstructures carry the harbour read over the quay.
 */
export function Harbour() {
  const yachts = buildYachts();

  return (
    <>
      {/* Sunset-teal harbour water — glossy so it glints gold under the HDRI. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(WATER_X_MIN + WATER_X_MAX) / 2, WATER_Y, 0]}
        receiveShadow
      >
        <planeGeometry args={[WATER_X_MAX - WATER_X_MIN, Z_MAX - Z_MIN]} />
        <meshStandardMaterial
          color="#143b3f"
          roughness={0.14}
          metalness={0.6}
        />
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
          emissiveIntensity={0.9}
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
