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
