"use client";

import { Instance, Instances } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import {
  abs,
  floor,
  fract,
  mix,
  normalWorld,
  positionWorld,
  sin,
  step,
  vec3,
} from "three/tsl";
import * as THREE from "three/webgpu";

import { scatter } from "../circuit/scatter";
import { HERO_TUNING } from "./tuning";

// Mediterranean harbour-front massing on the far (+x) backdrop side — the only
// side the fixed hero-pass camera sees — tiered up a hillside so back rows peek
// over front rows, PLUS the stage-flat closure at each end of the straight: a
// corner block the road bends behind (hiding the drive loop's U-turns) and a
// fogged vista block that seals the road corridor's horizon. All instanced into
// ONE draw call; procedural (zero bytes).

const Z_MIN = -55;
const Z_MAX = 55;

// Warm pastels that read as a Riviera town; window glow carries them at night.
const PASTELS = [
  "#e8c9a0",
  "#d98c6a",
  "#e6d3b3",
  "#cf9b7a",
  "#b5c4b1",
  "#e9b59a",
  "#dcc7a8",
  "#c98f74",
];

// Darker, desaturated masses for the end closures — distant city silhouettes.
const DUSK_MASSES = ["#4a4440", "#3f3a3d", "#54483f", "#463f45"];

interface Building {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}

interface Row {
  seed: number;
  xMin: number;
  xMax: number;
  hMin: number;
  hMax: number;
  spacing: number;
}

// Three depth tiers stepping back (+x) and up (+y) the hillside. Pushed back
// behind the harbour band (harbour.tsx fills x≈5.3–12.8) so the pastel city
// rises BEHIND the moored yachts — the Port-Hercule layering. Runs the full
// dressed z-length so the backdrop never ends mid-shot.
const ROWS: Row[] = [
  { seed: 11, xMin: 13, xMax: 15, hMin: 6, hMax: 11, spacing: 5 },
  { seed: 23, xMin: 17, xMax: 19.5, hMin: 11, hMax: 18, spacing: 5.5 },
  { seed: 37, xMin: 21.5, xMax: 25, hMin: 16, hMax: 26, spacing: 6.5 },
];

function buildingsForRow(row: Row): Building[] {
  const count = Math.ceil((Z_MAX - Z_MIN) / row.spacing);
  // Even z-spacing (no gaps) + a small per-instance jitter, all from the seeded
  // PRNG so the skyline is stable across builds (no Math.random / Date.now).
  return scatter(count, row.seed, (r, i) => {
    const w = r.range(3, 5.5);
    const d = r.range(2.5, 4.5);
    const h = r.range(row.hMin, row.hMax);
    const x = r.range(row.xMin, row.xMax);
    const z = Z_MIN + (i + 0.5) * row.spacing + r.range(-1.2, 1.2);
    const color = PASTELS[Math.floor(r.next() * PASTELS.length)] ?? "#e6d3b3";
    return { position: [x, h / 2, z], size: [w, h, d], color };
  });
}

// --- End closures ----------------------------------------------------------
// The drive loop's U-turns live at z ≈ ±58…±74 (car-rail.ts). The camera's
// look-clamp only limits where it AIMS — the turns would still sit inside the
// frame — so each end of the straight is staged shut:
//   • a CORNER block row (x 5.5…45, z ≈ ±56…±64): the wall/kerbs terminate into
//     it and the cars bend away behind it, exactly how a street vanishes behind
//     the block at a real corner;
//   • a VISTA block row (x −14…10, z ≈ ±74…±84) across the road corridor, deep
//     in the fog, so the corridor's horizon is city silhouette, not void.
interface EndCluster {
  seed: number;
  xMin: number;
  xMax: number;
  zCenter: number;
  hMin: number;
  hMax: number;
  count: number;
}

function endClusters(zSign: 1 | -1): EndCluster[] {
  return [
    // corner block — dense (wide boxes, small spacing) so no turn light leaks
    {
      seed: 61,
      xMin: 5.5,
      xMax: 45,
      zCenter: zSign * 60,
      hMin: 8,
      hMax: 16,
      count: 8,
    },
    // vista block across the corridor, swallowed by fog
    {
      seed: 73,
      xMin: -14,
      xMax: 10,
      zCenter: zSign * 79,
      hMin: 10,
      hMax: 20,
      count: 4,
    },
  ];
}

function buildingsForEndCluster(cluster: EndCluster): Building[] {
  const span = cluster.xMax - cluster.xMin;
  const spacing = span / cluster.count;
  // Different seed per side so the two ends don't mirror each other.
  const seed = cluster.seed + (cluster.zCenter > 0 ? 0 : 7);
  return scatter(cluster.count, seed, (r, i) => {
    const w = r.range(spacing * 0.9, spacing * 1.25); // overlap → no gaps
    const d = r.range(3.5, 6.5);
    const h = r.range(cluster.hMin, cluster.hMax);
    const x = cluster.xMin + (i + 0.5) * spacing;
    const z = cluster.zCenter + r.range(-1.5, 1.5);
    const color =
      DUSK_MASSES[Math.floor(r.next() * DUSK_MASSES.length)] ?? "#463f45";
    return { position: [x, h / 2, z], size: [w, h, d], color };
  });
}

// World-space window cell size (metres) so every building — whatever its scale —
// gets consistent real-world window sizing.
const WIN_W = 1.3;
const WIN_H = 1.7;

/**
 * A facade material: per-instance diffuse (via `<Instance color>`) plus a
 * procedural TSL emissive window grid — warm panes glow in `litRatio` of cells
 * (a deterministic per-cell hash) for the "occupied at night" read that makes a
 * box read as a building. The grid's HORIZONTAL coordinate is picked per-face
 * by the dominant world normal: an ±x-facing facade varies along z and a
 * ±z-facing facade along x (the boxes are axis-aligned and never rotated, so
 * normals stay axial). Keying it off `positionWorld.x` alone — as this material
 * originally did — left the camera-facing (−x) facades with a CONSTANT x per
 * face: whole fronts lit as full-width bands or not at all. Roof (±y) faces are
 * masked out. Zero texture bytes; one shared material across the InstancedMesh.
 */
function buildBuildingMaterial(
  windowEmissive: number,
  windowLitRatio: number,
): THREE.MeshStandardNodeMaterial {
  const material = new THREE.MeshStandardNodeMaterial();
  material.color = new THREE.Color("#e6d3b3"); // fallback if instanceColor is absent
  material.roughness = 0.86;
  material.metalness = 0;

  // 1 on ±x faces (vary along z), 0 on ±z faces (vary along x).
  const facesX = step(abs(normalWorld.z), abs(normalWorld.x));
  const horiz = mix(positionWorld.x, positionWorld.z, facesX);

  const gx = horiz.div(WIN_W).fract();
  const gy = positionWorld.y.div(WIN_H).fract();
  // A window pane occupies the central box of each cell.
  const pane = step(0.2, gx)
    .mul(step(gx, 0.8))
    .mul(step(0.28, gy))
    .mul(step(gy, 0.9));
  // Deterministic per-cell on/off hash, thresholded by the lit ratio.
  const cell = floor(horiz.div(WIN_W))
    .mul(12.99)
    .add(floor(positionWorld.y.div(WIN_H)).mul(78.23));
  const lit = step(1 - windowLitRatio, fract(sin(cell).mul(43758.5)));
  // Walls only — a rooftop never glows.
  const wall = step(abs(normalWorld.y), 0.5);
  material.emissiveNode = vec3(1.0, 0.78, 0.45)
    .mul(pane)
    .mul(lit)
    .mul(wall)
    .mul(windowEmissive);
  return material;
}

/** Tiered pastel Mediterranean facades + the end-closure masses — the Monaco
 * backdrop. Window emissive strength / lit ratio are leva-dialable. */
export function MonacoBuildings({
  windowEmissive = HERO_TUNING.windowEmissive,
  windowLitRatio = HERO_TUNING.windowLitRatio,
}: {
  windowEmissive?: number;
  windowLitRatio?: number;
} = {}) {
  const buildings = useMemo(
    () => [
      ...ROWS.flatMap(buildingsForRow),
      ...endClusters(1).flatMap(buildingsForEndCluster),
      ...endClusters(-1).flatMap(buildingsForEndCluster),
    ],
    [],
  );
  const material = useMemo(
    () => buildBuildingMaterial(windowEmissive, windowLitRatio),
    [windowEmissive, windowLitRatio],
  );
  useEffect(() => () => material.dispose(), [material]);

  return (
    <Instances limit={buildings.length} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={material} attach="material" />
      {buildings.map((b, i) => (
        <Instance
          key={i}
          position={b.position}
          scale={b.size}
          color={b.color}
        />
      ))}
    </Instances>
  );
}
