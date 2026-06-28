/**
 * The hero "race": three cars lapping the drive loop, choreographed into a
 * single deterministic overtake the fixed camera catches each lap. ALL timing is
 * a pure function of the lap `phase` (0..1), so the beat replays identically and
 * the grid loops seamlessly — nothing here touches Date.now() / Math.random().
 */

export type RaceRole = "ahead" | "leader" | "challenger";

export interface RaceCar {
  /** Static curve-param offset — the grid spacing along the lap. */
  tOffset: number;
  /** Body livery colour. */
  bodyColor: string;
  role: RaceRole;
}

/** Order matters: [car ahead (context), leader (inside line), challenger]. */
export const RACE_CARS: readonly RaceCar[] = [
  { role: "ahead", tOffset: 0.13, bodyColor: "#1f5fd0" },
  { role: "leader", tOffset: 0.0, bodyColor: "#9a1b1b" },
  { role: "challenger", tOffset: -0.05, bodyColor: "#e0a92e" },
];

/** World units the challenger swings off the racing line to draw alongside. */
export const LANE_OFFSET = 1.45;

// The pass window, in lap phase. The apex (cars level + fully alongside) is
// tuned to land on the camera-facing straight near z≈0 — dial in-browser.
const PASS_START = 0.54;
const PASS_APEX = 0.7;
const PASS_END = 0.86;
// Curve-param the challenger gains at the apex: exactly cancels its −0.05 grid
// gap so it draws LEVEL with the leader, then gives it back (net-zero per lap).
const GAIN_T = 0.05;

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Smoothstep 0→1 across [edge0, edge1]. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * A symmetric 0→1→0 bump across the pass window: rises to 1 at the apex, returns
 * to 0 by PASS_END, and is 0 everywhere outside. C¹ at the ends, net-zero, so
 * the grid resets every lap.
 */
function passBump(phase: number): number {
  if (phase <= PASS_START || phase >= PASS_END) return 0;
  return phase < PASS_APEX
    ? smoothstep(PASS_START, PASS_APEX, phase)
    : 1 - smoothstep(PASS_APEX, PASS_END, phase);
}

/**
 * Transient forward curve-param the challenger gains then gives back over the
 * pass (peaks at GAIN_T at the apex, 0 outside the window). NET-ZERO per lap so
 * the three-car grid returns to its start and the loop is seamless.
 */
export function overtakeProgress(phase: number): number {
  return GAIN_T * passBump(phase);
}

/**
 * The challenger's lane offset as a fraction of LANE_OFFSET: 0 on the racing
 * line, 1 fully alongside at the apex, 0 again by the window's end.
 */
export function laneEnvelope(phase: number): number {
  return passBump(phase);
}
