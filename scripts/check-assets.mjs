#!/usr/bin/env node
// CI guard for the asset pipeline: raw sources never ship, public/assets holds
// only content-hashed files + a manifest, and the bundle stays within budget.
import { execSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const RAW_DIR = "packages/asset-pipeline/raw-assets";
const OUT_DIR = "apps/web/public/assets";
const MAX_TOTAL_MB = 25; // matches budgets.json world3dPayloadMb

const errors = [];

// 1. Raw multi-MB sources must never be tracked in git (the dir scaffolding is).
const ALLOWED_TRACKED = new Set([".gitkeep", "README.md"]);
try {
  const tracked = execSync(`git ls-files ${RAW_DIR}`, { encoding: "utf8" })
    .split("\n")
    .filter((line) => line && !ALLOWED_TRACKED.has(line.split("/").pop()));
  if (tracked.length > 0) {
    errors.push(
      `raw assets are git-tracked (keep them out of git):\n  ${tracked.join("\n  ")}`,
    );
  }
} catch {
  // not a git repo / no matches — nothing to check
}

// 2. Shipped assets must all be content-hashed, accompanied by a manifest,
//    and within the total size budget.
if (existsSync(OUT_DIR)) {
  const files = readdirSync(OUT_DIR);
  const assets = files.filter((f) => f !== "manifest.json");

  if (assets.length > 0 && !files.includes("manifest.json")) {
    errors.push(`${OUT_DIR} has assets but no manifest.json`);
  }

  let totalBytes = 0;
  for (const file of assets) {
    totalBytes += statSync(join(OUT_DIR, file)).size;
    if (!/\.[0-9a-f]{16}\.[a-z0-9]+$/i.test(file)) {
      errors.push(`unhashed asset (rebuild via the pipeline): ${file}`);
    }
  }
  const totalMb = totalBytes / 1024 / 1024;
  if (totalMb > MAX_TOTAL_MB) {
    errors.push(
      `public/assets is ${totalMb.toFixed(1)} MB (> ${MAX_TOTAL_MB} MB budget)`,
    );
  }
}

if (errors.length > 0) {
  console.error("✗ asset guard failed:");
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log("✓ asset guard passed");
