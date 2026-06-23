import * as THREE from "three/webgpu";

/**
 * The closed path the hero car laps — a long, narrow loop that stays entirely on
 * the asphalt ribbon (the road is 9 wide × 70 long, centred on the origin and
 * running along ±z). The two long straights at x = ±2 read as "driving down the
 * road"; the U-turns at z ≈ ±30 keep the motion continuous (no teleport) and add
 * a banked sweep for the camera to play with. All within |x| ≤ 4.5, |z| ≤ 35.
 *
 * Tunable: these control points are art direction, not contract — the spine is
 * `carPoseAlongCurve` sampling whatever curve this returns.
 */
const HERO_DRIVE_POINTS: readonly [number, number, number][] = [
  [2, 0, -24],
  [2, 0, 0],
  [2, 0, 24],
  [0, 0, 30],
  [-2, 0, 24],
  [-2, 0, 0],
  [-2, 0, -24],
  [0, 0, -30],
];

/** Seconds for one full lap of the drive loop. */
export const HERO_DRIVE_LAP_SECONDS = 14;

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
 * Sample the (closed, arc-length-parameterised) curve at t: the car's world
 * position and the yaw that faces it along the direction of travel. Pure aside
 * from shared scratch vectors reused across calls (single car, one call/frame).
 */
export function carPoseAlongCurve(
  t: number,
  curve: THREE.CatmullRomCurve3,
): CarPose {
  const u = ((t % 1) + 1) % 1; // wrap into [0,1) for negative or >1 inputs
  curve.getPointAt(u, scratchPos);
  curve.getTangentAt(u, scratchTan);
  return {
    position: [scratchPos.x, scratchPos.y, scratchPos.z],
    yaw: headingFromTangent(scratchTan.x, scratchTan.z),
  };
}
