import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Document, Texture } from "@gltf-transform/core";
import { KHRTextureBasisu } from "@gltf-transform/extensions";

/** True when the KTX-Software `ktx` CLI is on PATH (needed to encode KTX2). */
export function isKtxAvailable(): boolean {
  try {
    execFileSync("ktx", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

type Encoding = "etc1s" | "uastc";

/**
 * Color textures (basecolor/emissive, sRGB) → ETC1S/BasisLZ; data textures
 * (normal/metallicRoughness/occlusion, linear) → UASTC. Matches the
 * KHR_texture_basisu guidance.
 */
function encodingForTexture(doc: Document, texture: Texture): Encoding {
  for (const material of doc.getRoot().listMaterials()) {
    if (
      material.getBaseColorTexture() === texture ||
      material.getEmissiveTexture() === texture
    ) {
      return "etc1s";
    }
    if (
      material.getNormalTexture() === texture ||
      material.getMetallicRoughnessTexture() === texture ||
      material.getOcclusionTexture() === texture
    ) {
      return "uastc";
    }
  }
  return "etc1s";
}

// Verified against KTX-Software v4 `ktx create` (toktx is deprecated).
function ktxArgs(encoding: Encoding, input: string, output: string): string[] {
  return encoding === "etc1s"
    ? ["create", "--format", "R8G8B8A8_SRGB", "--encode", "basis-lz", "--qlevel", "128", input, output] // prettier-ignore
    : ["create", "--format", "R8G8B8A8_UNORM", "--encode", "uastc", "--uastc-quality", "4", "--zstd", "18", input, output]; // prettier-ignore
}

/**
 * Encode every texture to KTX2 via the `ktx` CLI and re-attach through
 * KHR_texture_basisu. Requires KTX-Software (`brew install ktx`); callers must
 * gate on isKtxAvailable(). Not run in CI — outputs are committed/synced.
 */
export function compressTexturesToKtx2(doc: Document): void {
  const textures = doc.getRoot().listTextures();
  if (textures.length === 0) return;

  doc.createExtension(KHRTextureBasisu).setRequired(true);
  const work = mkdtempSync(join(tmpdir(), "ktx-"));
  try {
    textures.forEach((texture, i) => {
      const image = texture.getImage();
      if (image === null) return;
      const inPath = join(work, `tex-${i}.png`);
      const outPath = join(work, `tex-${i}.ktx2`);
      writeFileSync(inPath, image);
      execFileSync(
        "ktx",
        ktxArgs(encodingForTexture(doc, texture), inPath, outPath),
        {
          stdio: "ignore",
        },
      );
      texture
        .setImage(new Uint8Array(readFileSync(outPath)))
        .setMimeType("image/ktx2");
    });
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
