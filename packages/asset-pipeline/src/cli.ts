#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { extname, join } from "node:path";

import { hashedName, type AssetManifest } from "./hash.js";
import { processHdr } from "./hdr.js";
import { isKtxAvailable } from "./ktx.js";
import { optimizeGlb } from "./optimize.js";
import { isTextureFile, optimizeTexture } from "./texture.js";

const RAW_DIR = "packages/asset-pipeline/raw-assets";
const OUT_DIR = "apps/web/public/assets";

async function build(): Promise<void> {
  if (!existsSync(RAW_DIR)) {
    console.log(`no ${RAW_DIR} — nothing to build`);
    return;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const ktxAvailable = isKtxAvailable();
  if (!ktxAvailable) {
    console.warn(
      "⚠ ktx not found — textures ship uncompressed. Install KTX-Software " +
        "(`brew install ktx`, or the no-brew recipe in raw-assets/README.md) to enable KTX2.",
    );
  }

  const manifest: AssetManifest = {};
  for (const file of readdirSync(RAW_DIR).sort()) {
    const ext = extname(file).toLowerCase();
    const inputPath = join(RAW_DIR, file);

    if (ext === ".glb") {
      const result = await optimizeGlb(new Uint8Array(readFileSync(inputPath)));
      const name = hashedName(file, result.bytes);
      writeFileSync(join(OUT_DIR, name), result.bytes);
      manifest[file] = name;
      console.log(
        `${file} → ${name}  [${result.geometry}, ktx2:${result.ktx2}, ${(result.inputBytes / 1024).toFixed(0)}→${(result.outputBytes / 1024).toFixed(0)} KB]`,
      );
    } else if (ext === ".hdr") {
      const result = processHdr(new Uint8Array(readFileSync(inputPath)));
      if (result.warning) console.warn(`⚠ ${file}: ${result.warning}`);
      const name = hashedName(file, result.bytes);
      writeFileSync(join(OUT_DIR, name), result.bytes);
      manifest[file] = name;
      console.log(`${file} → ${name}`);
    } else if (isTextureFile(file)) {
      if (!ktxAvailable) {
        console.warn(`skipping ${file}: ktx CLI required to compress textures`);
        continue;
      }
      const result = optimizeTexture(inputPath);
      const name = hashedName(file.replace(/\.[^.]+$/, ".ktx2"), result.bytes);
      writeFileSync(join(OUT_DIR, name), result.bytes);
      manifest[file] = name;
      console.log(
        `${file} → ${name}  [ktx2 ${result.encoding}, ${(result.inputBytes / 1024).toFixed(0)}→${(result.outputBytes / 1024).toFixed(0)} KB]`,
      );
    } else {
      console.warn(`skipping unsupported file: ${file}`);
    }
  }

  writeFileSync(
    join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(`wrote ${Object.keys(manifest).length} asset(s) + manifest.json`);
}

const command = process.argv[2] ?? "build";
if (command !== "build") {
  console.error(`unknown command: ${command}`);
  process.exit(1);
}
build().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
