/**
 * The hero "race": a five-car field lapping the drive loop in the SAME
 * direction, with a red leader and a gold challenger running wheel-to-wheel and
 * trading the lead as they sweep the camera straight — a Verstappen-vs-Hamilton
 * battle, not a one-shot pass. ALL timing is a pure function of the lap `phase`
 * (0..1), so the beat replays identically and the grid loops seamlessly —
 * nothing here touches Date.now() / Math.random().
 */

export type RaceRole = "field" | "leader" | "challenger";

export interface RaceCar {
  /** Static curve-param offset — the grid spacing around the lap. */
  tOffset: number;
  /** Body livery colour. */
  bodyColor: string;
  role: RaceRole;
}

/**
 * Five cars spread around the loop so the frame stays populated as the pack rips
 * past. The leader (red) and challenger (gold) share a grid slot — they run as a
 * wheel-to-wheel pair (the challenger sits in the next lane, `CHALLENGER_LANE`,
 * and saws past on `passSwap`); the other three are the field for density.
 */
export const RACE_CARS: readonly RaceCar[] = [
  { role: "field", tOffset: 0.2, bodyColor: "#1f5fd0" }, // blue
  { role: "field", tOffset: 0.42, bodyColor: "#1f9d6d" }, // teal
  { role: "leader", tOffset: 0.6, bodyColor: "#9a1b1b" }, // red — the battle
  { role: "challenger", tOffset: 0.6, bodyColor: "#e0a92e" }, // gold — the battle
  { role: "field", tOffset: 0.82, bodyColor: "#d8dde3" }, // silver
];

/**
 * World units the challenger rides off the racing line, toward the camera (−x),
 * so it runs alongside the leader on the near side of the road — the closer,
 * more legible of the two lanes. Constant (not a windowed swing): the pair is
 * side-by-side whenever they're on the straight, and the *pass* itself is the
 * longitudinal saw below.
 */
export const CHALLENGER_LANE = -1.1;

/**
 * The lap phase at which the challenger is exactly LEVEL with the leader (the
 * side-by-side apex), tuned to land mid-straight, dead centre of the camera's
 * clamped window. `RACE_CARS` puts the pair at tOffset 0.6 and the near straight
 * is the first ~36% of the curve, so the pair is centre-frame near this phase.
 */
const PASS_CENTER = 0.59;

/** Peak longitudinal curve-param the challenger swings relative to the leader. */
const SWAP_AMP = 0.03;

/**
 * The challenger's longitudinal offset relative to the leader over the lap: a
 * pure sine (net-periodic → the grid loops seamlessly). It crosses zero rising
 * at `PASS_CENTER`, so across the visible straight the gold car enters BEHIND,
 * draws level centre-frame, and exits AHEAD — a clean overtake every lap — then
 * the leader takes it back on the hidden return leg.
 */
export function passSwap(phase: number): number {
  return SWAP_AMP * Math.sin(2 * Math.PI * (phase - PASS_CENTER));
}
