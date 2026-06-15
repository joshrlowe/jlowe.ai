import * as THREE from "three/webgpu";

import { envTexel, GOLDEN_HOUR, type SkyPalette } from "./env-gradient";

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
): THREE.DataTexture {
  const data = new Float32Array(WIDTH * HEIGHT * 4);
  for (let y = 0; y < HEIGHT; y++) {
    const [r, g, b] = envTexel(y / (HEIGHT - 1), palette);
    for (let x = 0; x < WIDTH; x++) {
      const i = (y * WIDTH + x) * 4;
      data[i] = r * intensity;
      data[i + 1] = g * intensity;
      data[i + 2] = b * intensity;
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
