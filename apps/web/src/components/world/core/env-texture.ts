import * as THREE from "three/webgpu";

import {
  envTexel,
  glowCombAt,
  GOLDEN_HOUR,
  type HorizonGlowComb,
  type SkyPalette,
} from "./env-gradient";

export { GOLDEN_HOUR, type SkyPalette } from "./env-gradient";

const WIDTH = 256;
const HEIGHT = 128;

/**
 * A small procedural equirectangular environment map for image-based lighting.
 * Assigned to `scene.environment`, the WebGPURenderer convolves it through its
 * **node-based** PMREM (`NodeMaterial` — NOT the classic `ShaderMaterial` that
 * makes drei's `<Environment>` WebGPU-incompatible). Zero asset bytes, identical
 * on both backends. `intensity` is baked into the radiance (instead of mutating
 * `scene.environmentIntensity`, which the hook-immutability lint forbids), so
 * the texture can be attached declaratively via `<primitive attach>`.
 */
export function buildEnvTexture(
  palette: SkyPalette = GOLDEN_HOUR,
  intensity = 1,
  glow?: HorizonGlowComb,
): THREE.DataTexture {
  const data = new Float32Array(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y++) {
    const v = y / (HEIGHT - 1);
    const [r, g, b] = envTexel(v, palette);
    for (let x = 0; x < WIDTH; x++) {
      // Optional floodlight glow comb splatted on top of the gradient (only the
      // night hero passes one; every other caller stays byte-identical).
      const [gr, gg, gb] =
        glow && glow.intensity > 0
          ? glowCombAt(x / (WIDTH - 1), v, glow)
          : [0, 0, 0];
      const i = (y * WIDTH + x) * 4;
      data[i] = r * intensity + gr;
      data[i + 1] = g * intensity + gg;
      data[i + 2] = b * intensity + gb;
      data[i + 3] = 1;
    }
  }
  const tex = new THREE.DataTexture(
    data,
    WIDTH,
    HEIGHT,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}
