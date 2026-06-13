import * as THREE from "three/webgpu";

export type Point3 = readonly [number, number, number];

/** Closed coastal-circuit control points (sea to +x, inland to -x). */
export const CIRCUIT_POINTS: readonly Point3[] = [
  [0, 0.02, 0],
  [34, 0.02, -12],
  [52, 0.02, -38],
  [44, 0.02, -68],
  [12, 0.02, -80],
  [-26, 0.02, -70],
  [-48, 0.02, -42],
  [-44, 0.02, -10],
  [-22, 0.02, 6],
];

export const TRACK_HALF_WIDTH = 5.5;

export interface TrackData {
  geometry: THREE.BufferGeometry;
  curve: THREE.CatmullRomCurve3;
  halfWidth: number;
}

/**
 * Build a flat road ribbon swept along a closed Catmull-Rom spline: two edge
 * vertices per sample (left/right of the tangent), triangulated into one
 * BufferGeometry (→ a single draw call) with a subtle edge-darkening baked into
 * vertex colors. The same curve drives beacon placement and the spawn pose.
 */
export function buildTrack(
  points: readonly Point3[] = CIRCUIT_POINTS,
  halfWidth = TRACK_HALF_WIDTH,
  segments = 260,
): TrackData {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    true,
    "catmullrom",
    0.5,
  );

  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, point);
    curve.getTangentAt(t, tangent);
    side.crossVectors(tangent, up).normalize();
    for (const s of [-1, 1]) {
      positions.push(
        point.x + side.x * halfWidth * s,
        point.y,
        point.z + side.z * halfWidth * s,
      );
      colors.push(0.05, 0.05, 0.06); // dark asphalt
    }
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    indices.push(a, c, b, b, c, d);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return { geometry, curve, halfWidth };
}

/** Spawn pose on the track start, facing the initial tangent. */
export function trackSpawn(curve: THREE.CatmullRomCurve3): {
  position: [number, number, number];
  heading: number;
} {
  const p = curve.getPointAt(0);
  const t = curve.getTangentAt(0);
  return {
    position: [p.x, p.y + 1.2, p.z],
    heading: Math.atan2(t.x, t.z), // y-rotation so +z (car forward) aligns with the tangent
  };
}
