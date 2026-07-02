/**
 * Pure sky-gradient math for the procedural IBL environment — no `three` import,
 * so it's unit-testable without a GPU. The builder in `env-texture.ts` samples
 * `envTexel()` per equirect row.
 */
export interface SkyPalette {
  /** Down (−Y), the ground-bounce colour. sRGB 0..255. */
  nadir: readonly [number, number, number];
  /** The bright horizon band. sRGB 0..255. */
  horizon: readonly [number, number, number];
  /** Up (+Y), the sky colour. sRGB 0..255. */
  zenith: readonly [number, number, number];
}

/** Golden-hour coast — mirrors the `GoldenHourEnvironment` light palette. */
export const GOLDEN_HOUR: SkyPalette = {
  nadir: [0x24, 0x14, 0x05],
  horizon: [0xff, 0x9b, 0x4a],
  zenith: [0x6b, 0x5a, 0x8c],
};

/**
 * Mediterranean night — a deep blue-violet sky with a faint warm city glow at
 * the horizon (town lights bouncing up). Drives a dim, cool IBL for the night
 * hero scene; the building windows, yacht cabins, headlights and brake lights
 * (boosted emissives + bloom) carry the actual illumination.
 */
export const NIGHT_HARBOUR: SkyPalette = {
  nadir: [0x05, 0x07, 0x0d],
  horizon: [0x34, 0x2c, 0x3a],
  zenith: [0x06, 0x09, 0x14],
};

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Linear-RGB texel for equirect latitude `v` (0 = nadir, 0.5 = horizon,
 * 1 = zenith). Output is linear (it feeds IBL, not the display), so callers
 * write it straight into a float texture.
 */
export function envTexel(
  v: number,
  palette: SkyPalette = GOLDEN_HOUR,
): [number, number, number] {
  const t = Math.min(Math.max(v, 0), 1);
  const a = t < 0.5 ? palette.nadir : palette.horizon;
  const b = t < 0.5 ? palette.horizon : palette.zenith;
  const f = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
  return [
    srgbToLinear((a[0] + (b[0] - a[0]) * f) / 255),
    srgbToLinear((a[1] + (b[1] - a[1]) * f) / 255),
    srgbToLinear((a[2] + (b[2] - a[2]) * f) / 255),
  ];
}

/**
 * A comb of bright pulses around the horizon band of the equirect env map —
 * floodlight heads ringing a night circuit. Baked INTO the IBL texture (not
 * geometry) so PMREM convolution turns each pulse into a hot specular the car
 * paint and wet surfaces can actually reflect on every tier; a metalness-0.95
 * body against a plain dark night gradient otherwise renders as a silhouette.
 */
export interface HorizonGlowComb {
  /** Number of pulses around the full 360° azimuth. */
  count: number;
  /** Equirect latitude of the band centre (0.5 = horizon). */
  vCenter: number;
  /** Half-width of the band in latitude. */
  vWidth: number;
  /** Azimuthal tightness exponent (higher = tighter, hotter spots). */
  sharpness: number;
  /** Peak added radiance, LINEAR RGB (HDR — deliberately > 1). */
  color: readonly [number, number, number];
  /** Overall scale on `color`. 0 disables. */
  intensity: number;
}

/**
 * Added linear radiance of the glow comb at equirect (u, v). Pure math (no
 * three import) so the pulse layout is unit-testable; `buildEnvTexture` adds
 * this on top of the palette gradient per texel.
 */
export function glowCombAt(
  u: number,
  v: number,
  comb: HorizonGlowComb,
): [number, number, number] {
  const azimuthal = Math.pow(
    Math.max(0, Math.cos(comb.count * 2 * Math.PI * u)),
    comb.sharpness,
  );
  const dv = Math.abs(v - comb.vCenter) / comb.vWidth;
  const band = Math.max(0, 1 - dv);
  const s = azimuthal * band * band * comb.intensity;
  return [comb.color[0] * s, comb.color[1] * s, comb.color[2] * s];
}
