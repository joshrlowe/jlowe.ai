import type { CapabilityTier } from "./capabilities";

export interface RendererInit {
  /** Force the WebGL2 backend of WebGPURenderer (the `webgl` tier). */
  forceWebGL: boolean;
}

/**
 * Maps a capability tier to WebGPURenderer options. Both 3D tiers use the SAME
 * renderer class (three's WebGPURenderer) — `webgl` just forces its WebGL2
 * backend. Returns null for `2d`, where no canvas should mount at all.
 */
export function rendererInitForTier(tier: CapabilityTier): RendererInit | null {
  switch (tier) {
    case "webgpu":
      return { forceWebGL: false };
    case "webgl":
      return { forceWebGL: true };
    case "2d":
      return null;
  }
}
