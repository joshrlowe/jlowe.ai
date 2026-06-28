"use client";

import { Instance, Instances } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { floor, fract, positionWorld, sin, step, vec3 } from "three/tsl";
import * as THREE from "three/webgpu";

import { scatter } from "../circuit/scatter";

// Mediterranean harbour-front massing on the far (+x) backdrop side — the only
// side the fixed hero-pass camera sees — tiered up a hillside so back rows peek
// over front rows. All instanced into ONE draw call; procedural (zero bytes).
// Runs the full visible z-length so the backdrop never ends mid-shot.

const Z_MIN = -34;
const Z_MAX = 34;

// Warm pastels that read as a sun-washed Riviera town under the golden IBL.
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
// rises BEHIND the moored yachts — the Port-Hercule layering. Heights bumped to
// keep the hillside looming now that it sits farther from the camera.
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

// World-space window cell size (metres) so every building — whatever its scale —
// gets consistent real-world window sizing.
const WIN_W = 1.3;
const WIN_H = 1.7;

/**
 * A facade material: per-instance pastel diffuse (via `<Instance color>`) plus a
 * procedural TSL emissive window grid — warm panes glow in ~60% of cells (a
 * deterministic per-cell hash) for the "occupied at dusk" read that makes a box
 * read as a building. Zero texture bytes; one shared material across the
 * InstancedMesh (the grid is keyed off `positionWorld`, so it varies per
 * building automatically).
 */
function buildBuildingMaterial(): THREE.MeshStandardNodeMaterial {
  const material = new THREE.MeshStandardNodeMaterial();
  material.color = new THREE.Color("#e6d3b3"); // fallback if instanceColor is absent
  material.roughness = 0.86;
  material.metalness = 0;

  const gx = positionWorld.x.div(WIN_W).fract();
  const gy = positionWorld.y.div(WIN_H).fract();
  // A window pane occupies the central box of each cell.
  const pane = step(0.2, gx)
    .mul(step(gx, 0.8))
    .mul(step(0.28, gy))
    .mul(step(gy, 0.9));
  // Deterministic per-cell on/off hash.
  const cell = floor(positionWorld.x.div(WIN_W))
    .mul(12.99)
    .add(floor(positionWorld.y.div(WIN_H)).mul(78.23));
  const lit = step(0.4, fract(sin(cell).mul(43758.5)));
  material.emissiveNode = vec3(1.0, 0.78, 0.45).mul(pane).mul(lit).mul(1.2);
  return material;
}

/** Tiered pastel Mediterranean facades — the Monaco backdrop. */
export function MonacoBuildings() {
  const buildings = useMemo(() => ROWS.flatMap(buildingsForRow), []);
  const material = useMemo(() => buildBuildingMaterial(), []);
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
