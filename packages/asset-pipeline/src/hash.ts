import { createHash } from "node:crypto";
import { basename, extname } from "node:path";

/** Short content hash for cache-busting, immutable asset filenames. */
export function contentHash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex").slice(0, 16);
}

/** `vehicle.glb` + bytes → `vehicle.<hash>.glb`. */
export function hashedName(logicalName: string, bytes: Uint8Array): string {
  const ext = extname(logicalName);
  const stem = basename(logicalName, ext);
  return `${stem}.${contentHash(bytes)}${ext}`;
}

export type AssetManifest = Record<string, string>;
