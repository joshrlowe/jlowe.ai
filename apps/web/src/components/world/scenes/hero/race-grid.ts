/**
 * The hero "race": a five-car field lapping the drive loop in the SAME
 * direction, with a red leader and a gold challenger running wheel-to-wheel and
 * trading the lead as they sweep the camera straight — a Verstappen-vs-Hamilton
 * battle, not a one-shot pass. ALL timing is a pure function of the lap `phase`
 * (0..1), so the beat replays identically and the grid loops seamlessly —
 * nothing here touches Date.now() / Math.random(). The choreography magnitudes
 * (lane, swing amplitude, swing centre) live in `tuning.ts` so they are
 * leva-dialable under ?debug=1.
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
 * wheel-to-wheel pair (the challenger sits in the next lane,
 * `HeroTuning.challengerLane`, and saws past on `passSwap`); the other three are
 * the field for density.
 */
export const RACE_CARS: readonly RaceCar[] = [
  { role: "field", tOffset: 0.2, bodyColor: "#1f5fd0" }, // blue
  { role: "field", tOffset: 0.42, bodyColor: "#1f9d6d" }, // teal
  { role: "leader", tOffset: 0.6, bodyColor: "#9a1b1b" }, // red — the battle
  { role: "challenger", tOffset: 0.6, bodyColor: "#e0a92e" }, // gold — the battle
  { role: "field", tOffset: 0.82, bodyColor: "#d8dde3" }, // silver
];

/**
 * The challenger's longitudinal offset relative to the leader over the lap: a
 * pure sine with peak curve-param swing `amp` (net-periodic → the grid loops
 * seamlessly). It crosses zero RISING at phase `center`, so across the visible
 * straight the gold car enters BEHIND, draws level centre-frame, and exits
 * AHEAD — a clean overtake every lap — then the leader takes it back on the
 * hidden return leg. `center` is tuned so "level" lands mid-straight (see
 * `HeroTuning.passCenter` for the derivation).
 */
export function passSwap(phase: number, amp: number, center: number): number {
  return amp * Math.sin(2 * Math.PI * (phase - center));
}
