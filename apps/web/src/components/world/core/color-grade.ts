import { add, clamp, luminance, mix, mul, saturation, vec3 } from "three/tsl";
import type { Node } from "three/webgpu";

/**
 * Warm/teal cinematic colour grade as a pure TSL node — a lift-gain rig plus a
 * luminance-keyed split-tone (teal in the shadows, amber in the highlights),
 * the signature "golden-hour blockbuster" look. Deliberately NOT a 3D-LUT
 * (`lut3D` from three's `Lut3DNode`): a LUT would add a `.cube`/PNG asset, and
 * the world asset budget (`scripts/check-assets.mjs`, 8 MB) is best kept
 * byte-for-byte. This node ships zero bytes and stays fully tunable in code.
 *
 * Applied at the very END of the ultra post-FX chain in `core/post-fx.tsx`
 * (after bloom), gated to the ultra WebGPU branch plus a per-scene opt-in
 * (`core/scene-capabilities.ts`). The caller
 * blends the graded result back over the input by a `colorGrade` strength so
 * the look is dialable (0 = ungraded; the ultra preset ships 1).
 *
 * Built from free-function TSL ops only (each returns a chainable `Node`); we
 * never chain methods off a raw `vec3()` constructor (that returns a bare
 * `VarNode`, which is not method-chainable in the type system).
 *
 * Tuning these constants needs a real GPU — see the PR notes. The values below
 * are sensible golden-hour defaults, not a calibrated grade.
 */

// Lift (adds a cool floor to the blacks) and gain (amber-biased highlights).
const LIFT = vec3(0.012, 0.008, 0.022);
const GAIN = vec3(1.06, 1.02, 0.95);

// Split-tone targets, mixed in by a luminance key.
const SHADOW_TINT = vec3(0.55, 0.7, 0.85); // teal
const HIGHLIGHT_TINT = vec3(1.08, 0.94, 0.74); // warm amber
const SPLIT_AMOUNT = 0.16; // how hard the split-tone pushes
const SATURATION = 1.08; // a touch richer overall

/**
 * Grade an RGB color node. Returns a new `vec3` node; the caller composites it
 * (typically `mix(input, graded, strength)`).
 */
export function gradeColor(colorRgb: Node<"vec3">): Node<"vec3"> {
  // Lift + gain, clamped to the legal range.
  const lifted = clamp(add(mul(colorRgb, GAIN), LIFT), 0, 1);

  // Luminance key (0 = shadow, 1 = highlight) drives the split-tone target.
  const key = luminance(lifted);
  const tint = mix(SHADOW_TINT, HIGHLIGHT_TINT, key);

  // Blend toward the (doubled, so it lifts rather than only darkens) tinted
  // color by a small amount — colours the image without recolouring it.
  const splitToned = mix(lifted, mul(lifted, mul(tint, 2)), SPLIT_AMOUNT);

  return saturation(clamp(splitToned, 0, 1), SATURATION);
}
