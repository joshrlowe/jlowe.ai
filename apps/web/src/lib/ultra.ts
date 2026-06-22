/**
 * The "ultra" quality axis — ORTHOGONAL to `CapabilityTier`. Ultra is NOT a
 * renderer tier (`?mode=ultra` stays invalid; see `VALID_TIERS`); it is a
 * separate boolean that stacks high-ROI WebGPU-only effects on top of the
 * resolved tier.
 *
 * Selection is a small pure function so it is fully unit-testable and SSR-safe:
 * an explicit `?quality=` override wins, otherwise a strong-GPU heuristic
 * decides. Surfaced to the scene framework through `core/quality-provider`.
 */

import type { CapabilityTier } from "./capabilities";

export type QualityOverride = "ultra" | "high" | "standard";

const QUALITY_OVERRIDES: readonly QualityOverride[] = [
  "ultra",
  "high",
  "standard",
];

/** `?quality=ultra|high|standard` override (null = no override / heuristic). */
export function parseQualityOverride(search: string): QualityOverride | null {
  const value = new URLSearchParams(search).get("quality");
  return value !== null &&
    (QUALITY_OVERRIDES as readonly string[]).includes(value)
    ? (value as QualityOverride)
    : null;
}

export interface UltraSignals {
  tier: CapabilityTier;
  override: QualityOverride | null;
  /** A real WebGPU adapter was confirmed (null until `refine()` runs). */
  adapterConfirmed: boolean | null;
  deviceMemory: number | null;
}

/** Strong-GPU heuristic memory floor (GB). */
const STRONG_GPU_MEMORY_GB = 8;

/**
 * Resolve the ultra axis. Ultra is gated to the `webgpu` tier — `webgl`/`2d`
 * never select ultra (even with an explicit `?quality=ultra`, where the
 * post-FX backend gate degrades to the bloom+vignette floor). On `webgpu`, an
 * explicit override wins over the heuristic; otherwise ultra is auto-ON only
 * when a real adapter is confirmed AND device memory clears the strong-GPU bar.
 */
export function selectIsUltra({
  tier,
  override,
  adapterConfirmed,
  deviceMemory,
}: UltraSignals): boolean {
  if (tier !== "webgpu") return false;
  if (override !== null) return override === "ultra";
  return (
    adapterConfirmed === true &&
    deviceMemory !== null &&
    deviceMemory >= STRONG_GPU_MEMORY_GB
  );
}
