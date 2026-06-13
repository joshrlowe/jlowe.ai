import { dedup, draco, meshopt, prune, weld } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";

import { createIO } from "./io.js";
import { compressTexturesToKtx2, isKtxAvailable } from "./ktx.js";

export interface OptimizeResult {
  bytes: Uint8Array;
  inputBytes: number;
  outputBytes: number;
  geometry: "draco" | "meshopt";
  ktx2: "applied" | "skipped-no-ktx";
}

/**
 * Optimize a glb: dedup/prune/weld, then Draco for static geometry or Meshopt
 * when animations are present (Meshopt's filters preserve animation), then KTX2
 * textures when the `ktx` CLI is available. Returns the optimized bytes for the
 * caller to content-hash and write.
 */
export async function optimizeGlb(input: Uint8Array): Promise<OptimizeResult> {
  const io = await createIO();
  const doc = await io.readBinary(input);

  const animated = doc.getRoot().listAnimations().length > 0;
  const geometry = animated ? "meshopt" : "draco";
  await doc.transform(
    dedup(),
    prune(),
    weld(),
    animated ? meshopt({ encoder: MeshoptEncoder }) : draco(),
  );

  let ktx2: OptimizeResult["ktx2"] = "skipped-no-ktx";
  if (isKtxAvailable()) {
    compressTexturesToKtx2(doc);
    ktx2 = "applied";
  }

  const bytes = await io.writeBinary(doc);
  return {
    bytes,
    inputBytes: input.byteLength,
    outputBytes: bytes.byteLength,
    geometry,
    ktx2,
  };
}
