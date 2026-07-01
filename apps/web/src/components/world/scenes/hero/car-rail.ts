import * as THREE from "three/webgpu";

/**
 * The closed path the field laps — one long STRAIGHT down the road on the
 * camera-facing side (x = 0, z ∈ [−50, 50], travelling +z), then a wide return
 * leg that bulges far out to +x (apex x ≈ 40, turns at z ≈ ±60) BEHIND the
 * Monaco buildings so the loop closes with no teleport and the U-turns never
 * enter frame. Every car runs the SAME direction down the visible straight — a
 * pack racing past, not two lines passing head-on. The camera clamps its look to
 * the straight's window (hero.tsx `HERO_PASS.lookClamp`) so it never yaws around
 * to the hidden return.
 *
 * Tunable: these control points are art direction, not contract — the spine is
 * `carPoseAlongCurve` sampling whatever curve this returns.
 */
const HERO_DRIVE_POINTS: readonly [number, number, number][] = [
  // Long straight on the racing line (x = 0), nose toward +z.
  [0, 0, -50],
  [0, 0, -25],
  [0, 0, 0],
  [0, 0, 25],
  [0, 0, 50],
  // Return leg — a teardrop bulging out to +x, hidden behind the city; its two
  // turns sit at z ≈ ±60, outside the camera's clamped look window.
  [20, 0, 60],
  [40, 0, 40],
  [40, 0, 0],
  [40, 0, -40],
  [20, 0, -60],
];

/** Seconds for one full lap of the drive loop — short, so the pack rips past. */
export const HERO_DRIVE_LAP_SECONDS = 7;

/**
 * Build the closed drive curve. `centripetal` Catmull-Rom avoids the cusps and
 * wide overshoots a uniform spline produces on far-apart control points — so the
 * loop hugs the points and stays on the road.
 */
export function buildHeroDriveCurve(): THREE.CatmullRomCurve3 {
  const points = HERO_DRIVE_POINTS.map(
    ([x, y, z]) => new THREE.Vector3(x, y, z),
  );
  return new THREE.CatmullRomCurve3(points, true, "centripetal");
}

export interface CarPose {
  position: [number, number, number];
  /** Yaw (radians) that aims a +z-facing model along the path tangent. */
  yaw: number;
}

/**
 * Yaw that points a model whose nose is +z (at yaw 0) along the xz-plane tangent
 * (tx, tz): 0 faces +z, +π/2 faces +x, ±π faces −z. The hero car's GLB nose is
 * authored toward −x, so its primitive keeps a fixed +π/2 model offset and this
 * yaw is applied to the wrapping group on top of it (see hero-car.tsx).
 */
export function headingFromTangent(tx: number, tz: number): number {
  return Math.atan2(tx, tz);
}

const scratchPos = new THREE.Vector3();
const scratchTan = new THREE.Vector3();

/**
 * Sample the (closed, arc-length-parameterised) curve at t, displaced by a
 * signed LATERAL offset (world units) perpendicular to the direction of travel
 * in the ground plane — used to put a car off the racing line into the
 * overtaking lane. The offset is along `cross(tangent, up)` (the curve's
 * left/right), and yaw is UNCHANGED so two cars stay parallel for a clean
 * side-by-side pass. Pure aside from shared scratch vectors; each call reads the
 * scratch into a fresh result before returning, so the few calls/frame are safe.
 */
export function carPoseAlongCurveOffset(
  t: number,
  curve: THREE.CatmullRomCurve3,
  lateral: number,
): CarPose {
  const u = ((t % 1) + 1) % 1; // wrap into [0,1) for negative or >1 inputs
  curve.getPointAt(u, scratchPos);
  curve.getTangentAt(u, scratchTan);
  // side = cross(tangent, up) in the xz-plane: tangent (tx,_,tz) × (0,1,0)
  // = (tz, 0, -tx); normalise so `lateral` is in world units.
  const sx = scratchTan.z;
  const sz = -scratchTan.x;
  const len = Math.hypot(sx, sz) || 1;
  return {
    position: [
      scratchPos.x + (lateral * sx) / len,
      scratchPos.y,
      scratchPos.z + (lateral * sz) / len,
    ],
    yaw: headingFromTangent(scratchTan.x, scratchTan.z),
  };
}

/**
 * Sample the car's pose on the racing line (no lateral offset) — the single-car
 * spine. Equivalent to `carPoseAlongCurveOffset(t, curve, 0)`.
 */
export function carPoseAlongCurve(
  t: number,
  curve: THREE.CatmullRomCurve3,
): CarPose {
  return carPoseAlongCurveOffset(t, curve, 0);
}
