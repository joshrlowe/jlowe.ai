"use client";

import { useLoader, useThree } from "@react-three/fiber";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import type { Texture } from "three/webgpu";

// The Basis Universal transcoder (`basis_transcoder.js` + `.wasm`) is
// self-hosted under /public/basis — the same pattern as the Draco decoder in
// /public/draco (see hero/hero-model.tsx). Keeping it on our own origin means
// no external CDN, so no runtime 404s and nothing for a strict CSP to block on
// the static export. KTX2Loader fetches both files from this path lazily, the
// first time a .ktx2 is parsed.
const TRANSCODER_PATH = "/basis/";

/**
 * Load a keyed set of KTX2 (Basis Universal) textures through R3F's loading
 * manager, so the pre-flight bar tracks them via drei `useProgress` exactly as
 * it did the raw JPGs.
 *
 * KTX2 stays GPU-compressed after upload, so the loader must transcode to a
 * format the GPU actually supports. `detectSupport(gl)` reads the renderer's
 * capabilities to choose that target; it works for **both** tiers because both
 * use the same `WebGPURenderer` class (the `webgl` tier only passes
 * `forceWebGL: true`) and `KTX2Loader.detectSupport` branches on
 * `renderer.isWebGPURenderer` internally, reading WebGPU features or WebGL2
 * extensions accordingly. `renderer.init()` has already resolved by the time any
 * scene mounts (WorldCanvas awaits it), so the capability probe is ready.
 *
 * `gl` is typed as three's `WebGLRenderer` by R3F, which `detectSupport` accepts
 * as one of its overloads; at runtime it is the `WebGPURenderer` instance.
 *
 * Unlike `useTexture`, there is no module-scope `.preload()` here: KTX2Loader
 * throws without a prior `detectSupport(renderer)`, and there is no renderer at
 * module-eval time. The loads are still tracked — they fire (and Suspense-block)
 * when the scene mounts, under R3F's DefaultLoadingManager.
 */
export function useKtx2Textures<K extends string>(
  urls: Record<K, string>,
): Record<K, Texture> {
  const gl = useThree((state) => state.gl);
  const keys = Object.keys(urls) as K[];

  const loaded = useLoader(
    KTX2Loader,
    keys.map((key) => urls[key]),
    (loader) => {
      loader.setTranscoderPath(TRANSCODER_PATH);
      loader.detectSupport(gl);
    },
  );

  // useLoader returns an array here (array input); guard defensively anyway.
  // The loaders come from bare `three`; bridge to the `three/webgpu` Texture
  // type the world code uses (same `as unknown as` seam as hero/hero-model).
  const list = Array.isArray(loaded) ? loaded : [loaded];
  const byKey = {} as Record<K, Texture>;
  keys.forEach((key, i) => {
    byKey[key] = list[i] as unknown as Texture;
  });
  return byKey;
}
