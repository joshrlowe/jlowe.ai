/**
 * Maps normalized engine rpm (0..1, written by the vehicle into the chapter
 * store) to the synth parameters of the procedural engine. Pure + unit-tested;
 * the AudioManager just ramps the live nodes toward these targets.
 */
export interface EngineParams {
  /** Oscillator fundamental, Hz. */
  frequency: number;
  /** Engine low-pass cutoff, Hz — opens up as the revs climb. */
  cutoff: number;
  /** Engine bus gain, 0..1 — louder under load. */
  gain: number;
}

export function engineParamsForRpm(rpm: number): EngineParams {
  const r = Math.min(Math.max(rpm, 0), 1);
  return {
    frequency: 45 + r * 190,
    cutoff: 320 + r * 2200,
    gain: 0.05 + r * 0.13,
  };
}
