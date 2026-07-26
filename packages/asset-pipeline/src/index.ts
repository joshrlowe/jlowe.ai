/**
 * @velocity/asset-pipeline — optimizes raw .glb/.hdr source art into hashed,
 * web-ready assets for the 3D world: Draco/Meshopt geometry, KTX2 textures
 * (via the KTX-Software `ktx` CLI), and a content-hash manifest.
 */
export const PIPELINE_VERSION = "1.0.0";

export { optimizeGlb, type OptimizeResult } from "./optimize.js";
export {
  isTextureFile,
  optimizeTexture,
  textureColorSpace,
  type TextureColorSpace,
  type TextureEncoding,
  type TextureResult,
} from "./texture.js";
export { contentHash, hashedName, type AssetManifest } from "./hash.js";
export { processHdr, type HdrResult } from "./hdr.js";
export { isKtxAvailable } from "./ktx.js";
export { sampleCubeGlb } from "./sample.js";
export { createIO } from "./io.js";
