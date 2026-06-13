/**
 * @velocity/asset-pipeline — optimizes raw .glb/.hdr source art into hashed,
 * web-ready assets (Draco/meshopt geometry, KTX2 textures, PMREM-ready env
 * maps) for the 3D world. Phase 0 ships the stub; the real pipeline lands in
 * Phase 1.
 */

export const PIPELINE_VERSION = "0.0.0";

export interface RunResult {
  status: "noop";
  version: string;
}

/**
 * Placeholder entry point. Phase 1 replaces this with glTF-Transform +
 * KTX-Software optimization and content-hash manifest emission.
 */
export function run(_args: readonly string[]): RunResult {
  return { status: "noop", version: PIPELINE_VERSION };
}
