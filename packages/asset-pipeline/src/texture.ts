import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * Standalone image → KTX2 (Basis Universal) compression via the KTX-Software
 * `ktx` CLI. This is the loose-texture counterpart to optimize.ts/ktx.ts, which
 * compress textures *embedded* in glb files through gltf-transform. Loose PBR
 * maps the world loads by URL (the tarmac + rock map sets) go through here.
 *
 * KTX2 keeps textures GPU-compressed after upload (transcoded to BCn/ASTC/ETC),
 * so the win is dominated by VRAM, not just disk: a 2K map is ~16 MB of RGBA in
 * VRAM as a decoded JPG/PNG versus a few MB transcoded.
 */

export type TextureColorSpace = "srgb" | "linear";
export type TextureEncoding = "etc1s" | "uastc";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

// Filename suffixes that mark a *data* map (linear, no gamma). Everything else
// is treated as sRGB colour. Matches the CC0 map-set naming (`*_color`,
// `*_normal`, `*_roughness`, …) and the KHR_texture_basisu encoding guidance.
const LINEAR_SUFFIXES = [
  "_normal",
  "_nrm",
  "_roughness",
  "_rough",
  "_metal",
  "_metallic",
  "_metalness",
  "_occlusion",
  "_ao",
  "_orm",
  "_arm",
  "_height",
  "_disp",
  "_displacement",
  "_bump",
];

/** True when `file` is a standalone image the texture path can compress. */
export function isTextureFile(file: string): boolean {
  const dot = file.lastIndexOf(".");
  return dot >= 0 && IMAGE_EXTENSIONS.has(file.slice(dot).toLowerCase());
}

/**
 * Colour maps (basecolor/albedo/emissive) are sRGB → ETC1S/BasisLZ; data maps
 * (normal/roughness/metalness/occlusion/height) are linear → UASTC. Inferred
 * from the filename suffix; unlabelled maps default to sRGB colour.
 */
export function textureColorSpace(file: string): TextureColorSpace {
  const name = file.toLowerCase();
  return LINEAR_SUFFIXES.some((suffix) => name.includes(suffix))
    ? "linear"
    : "srgb";
}

export interface TextureResult {
  bytes: Uint8Array;
  colorSpace: TextureColorSpace;
  encoding: TextureEncoding;
  inputBytes: number;
  outputBytes: number;
}

// `--assign-tf` forces the transfer function *without* re-sampling the pixels,
// so data maps keep their exact bytes (a sRGB→linear conversion would corrupt
// normals/roughness). `--generate-mipmap` is required because compressed GPU
// formats can't be mip-generated at upload, and these maps tile heavily and are
// viewed at grazing angles — the mip chain is what prevents aliasing/moiré.
function ktxCreateArgs(
  colorSpace: TextureColorSpace,
  input: string,
  output: string,
): string[] {
  return colorSpace === "srgb"
    ? ["create", "--format", "R8G8B8A8_SRGB", "--assign-tf", "srgb", "--encode", "basis-lz", "--qlevel", "128", "--generate-mipmap", input, output] // prettier-ignore
    : ["create", "--format", "R8G8B8A8_UNORM", "--assign-tf", "linear", "--encode", "uastc", "--uastc-quality", "4", "--zstd", "18", "--generate-mipmap", input, output]; // prettier-ignore
}

/**
 * Encode one image file to a KTX2 texture and return the bytes for the caller
 * to content-hash and write. Requires the KTX-Software `ktx` CLI on PATH;
 * callers must gate on isKtxAvailable(). Not run in CI — outputs are committed.
 */
export function optimizeTexture(inputPath: string): TextureResult {
  const colorSpace = textureColorSpace(inputPath);
  const encoding: TextureEncoding = colorSpace === "srgb" ? "etc1s" : "uastc";
  const inputBytes = statSync(inputPath).size;

  const work = mkdtempSync(join(tmpdir(), "ktx-tex-"));
  const outPath = join(work, "out.ktx2");
  try {
    execFileSync("ktx", ktxCreateArgs(colorSpace, inputPath, outPath), {
      stdio: "ignore",
    });
    const bytes = new Uint8Array(readFileSync(outPath));
    return {
      bytes,
      colorSpace,
      encoding,
      inputBytes,
      outputBytes: bytes.byteLength,
    };
  } finally {
    rmSync(dirname(outPath), { recursive: true, force: true });
  }
}
