export interface CinematicPathConfig {
  /** The point the camera orbits and looks at (the car). */
  center: readonly [number, number, number];
  radius: number;
  baseHeight: number;
  /** Vertical bob added to `baseHeight`. */
  heightAmplitude: number;
  /** Orbit angular speed (radians/sec) — keep slow for a cinematic dolly. */
  angularSpeed: number;
  /** Vertical bob speed (radians/sec). */
  bobSpeed: number;
  /** Starting orbit angle (radians). */
  startAngle?: number;
}

export interface CameraPose {
  position: [number, number, number];
  lookAt: [number, number, number];
}

/**
 * Pure cinematic camera path: a slow dolly orbit around `center` with a gentle
 * vertical bob. Deterministic in `elapsed` so the rig stays smooth and the path
 * is unit-testable.
 */
export function cinematicCameraPose(
  elapsed: number,
  cfg: CinematicPathConfig,
): CameraPose {
  const angle = (cfg.startAngle ?? 0) + elapsed * cfg.angularSpeed;
  const [cx, cy, cz] = cfg.center;
  const x = cx + cfg.radius * Math.cos(angle);
  const z = cz + cfg.radius * Math.sin(angle);
  const y =
    cfg.baseHeight + cfg.heightAmplitude * Math.sin(elapsed * cfg.bobSpeed);
  return { position: [x, y, z], lookAt: [cx, cy, cz] };
}
