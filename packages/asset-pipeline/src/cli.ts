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

const RAW_DIR = "packages/asset-pipeline/raw-assets";
const OUT_DIR = "apps/web/public/assets";

async function build(): Promise<void> {
  if (!existsSync(RAW_DIR)) {
    console.log(`no ${RAW_DIR} — nothing to build`);
    return;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  if (!isKtxAvailable()) {
    console.warn(
      "⚠ ktx not found — textures ship uncompressed. `brew install ktx` to enable KTX2.",
    );
  }

  const manifest: AssetManifest = {};
  for (const file of readdirSync(RAW_DIR).sort()) {
    const ext = extname(file).toLowerCase();
    const input = new Uint8Array(readFileSync(join(RAW_DIR, file)));

    if (ext === ".glb") {
      const result = await optimizeGlb(input);
      const name = hashedName(file, result.bytes);
      writeFileSync(join(OUT_DIR, name), result.bytes);
      manifest[file] = name;
      console.log(
        `${file} → ${name}  [${result.geometry}, ktx2:${result.ktx2}, ${(result.inputBytes / 1024).toFixed(0)}→${(result.outputBytes / 1024).toFixed(0)} KB]`,
      );
    } else if (ext === ".hdr") {
      const result = processHdr(input);
      if (result.warning) console.warn(`⚠ ${file}: ${result.warning}`);
      const name = hashedName(file, result.bytes);
      writeFileSync(join(OUT_DIR, name), result.bytes);
      manifest[file] = name;
      console.log(`${file} → ${name}`);
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
