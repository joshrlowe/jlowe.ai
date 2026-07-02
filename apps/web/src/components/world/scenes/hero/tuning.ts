/**
 * Every hero-scene art dial in one place, with the shipped look as defaults.
 * The scene reads THESE values (threaded through `useHeroTuning`, which layers
 * a leva panel over them under `?debug=1`), so the whole night race is tunable
 * live in a browser on dev — dial, read the number off the panel, and the
 * number becomes the next default here. Kept free of three so it stays
 * trivially unit-testable.
 */
export interface HeroTuning {
  // --- race ---------------------------------------------------------------
  /** Seconds for one full lap of the drive loop — short, so the pack rips past. */
  lapSeconds: number;
  /**
   * World units the challenger rides off the racing line, toward the camera
   * (−x), so it runs alongside the leader on the near, more legible lane.
   */
  challengerLane: number;
  /** Peak longitudinal curve-param the challenger swings relative to the leader. */
  passAmp: number;
  /**
   * Lap phase at which the challenger is exactly LEVEL with the leader. Tuned
   * so the side-by-side apex lands mid-straight, dead centre of the camera's
   * clamped window: the pair sits at grid slot 0.6 and mid-straight is curve
   * param ≈ 0.15, so level falls at basePhase ≈ (0.15 − 0.6) mod 1 ≈ 0.55.
   */
  passCenter: number;

  // --- camera (hero-pass rig) ----------------------------------------------
  camX: number;
  camY: number;
  camZ: number;
  /** Longer lens than the global 50° — compresses the pack, broadcast-style. */
  fov: number;
  /** Raise the look target above the car origin, onto the bodywork. */
  lookHeight: number;
  /** Look-tracking retention per second (smaller = snappier pan). */
  lookDamping: number;
  /** Amplitude (world units) of the slow dolly drift along z. */
  dollyAmplitude: number;
  /** Dolly drift speed (radians/sec). */
  dollySpeed: number;
  /** Look-target clamp: cap toward the backdrop (x) / along the road (z). */
  clampX: number;
  clampZ: number;

  // --- night light --------------------------------------------------------
  /** Base IBL strength for the night sky (scaled by the per-tier factor). */
  envIntensity: number;
  /** Cool moon key directional. */
  moonIntensity: number;
  /** Cool ambient dome that lifts the shadow side off pure black. */
  hemiIntensity: number;
  /** The warm streetlamp/window-bounce pool on the city side. */
  cityPointIntensity: number;
  /** Hero-scoped tone-mapping exposure (AgX). */
  exposure: number;
  /** Night haze — swallows the far straight and the distant set edges. */
  fogNear: number;
  fogFar: number;
  /**
   * Floodlight glow comb baked into the night IBL (env-gradient.ts) — the hot
   * spots the car paint + wet surfaces reflect on every tier. 0 disables.
   */
  envGlowIntensity: number;
  /** Floodlight head emissive (the bloom halos on the masts). */
  floodlightHeadEmissive: number;
  /** SpotLight pool intensity — the bright/dark strobe down the straight. */
  floodlightPoolIntensity: number;

  // --- set dressing emissives ----------------------------------------------
  /** Building window-pane emissive strength (the night's primary light motif). */
  windowEmissive: number;
  /** Fraction of window cells lit (deterministic per-cell hash threshold). */
  windowLitRatio: number;
  /** Yacht superstructure warm glow. */
  cabinEmissive: number;
  /** Fake mirrored window-streaks on the harbour water. 0 disables. */
  waterStreakIntensity: number;

  // --- car ------------------------------------------------------------------
  bodyMetalness: number;
  bodyRoughness: number;
  bodyEnvMapIntensity: number;
  /**
   * The FIA rain light — the red LED block on the rear crash structure, and an
   * open-wheeler's ONLY light (no headlights on a formula car). At night it is
   * the pack's trailing signature, so it gets its own dials; y/z place it on
   * the placeholder GLB's tail until the real car model lands.
   */
  rainLightEmissive: number;
  rainLightY: number;
  rainLightZ: number;
}

/** The shipped hero look — every constant the scene actually renders with. */
export const HERO_TUNING: HeroTuning = {
  lapSeconds: 7,
  challengerLane: -1.1,
  passAmp: 0.03,
  passCenter: 0.55,

  camX: -8,
  camY: 3.0,
  camZ: 0,
  fov: 38,
  lookHeight: 0.5,
  lookDamping: 0.0008,
  dollyAmplitude: 1.1,
  dollySpeed: 0.12,
  clampX: 4,
  clampZ: 20,

  envIntensity: 0.6,
  moonIntensity: 0.55,
  hemiIntensity: 0.35,
  cityPointIntensity: 40,
  exposure: 1.1,
  fogNear: 35,
  fogFar: 95,
  envGlowIntensity: 2.5,
  floodlightHeadEmissive: 6,
  floodlightPoolIntensity: 260,

  windowEmissive: 2.6,
  windowLitRatio: 0.6,
  cabinEmissive: 0.9,
  waterStreakIntensity: 0.5,

  bodyMetalness: 0.95,
  bodyRoughness: 0.28,
  bodyEnvMapIntensity: 1.5,
  rainLightEmissive: 4,
  rainLightY: 0.5,
  rainLightZ: -1.85,
};
