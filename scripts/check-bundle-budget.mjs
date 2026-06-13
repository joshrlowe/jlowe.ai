#!/usr/bin/env node
// Gz first-load JS budget gate for the static export. Scrapes the emitted
// HTML in apps/web/out (ground truth for what each route actually fetches —
// bundler-agnostic, route groups already stripped from the paths) and sums the
// gzipped size of every referenced /_next chunk per route, comparing against
// budgets.json. Exits 1 on any breach.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, relative } from "node:path";

const OUT_DIR = "apps/web/out";
const BUDGETS_FILE = "budgets.json";

if (!existsSync(OUT_DIR)) {
  console.error(
    `✗ ${OUT_DIR} not found — run \`pnpm --filter @velocity/web build\` first.`,
  );
  process.exit(1);
}

const budgets = JSON.parse(readFileSync(BUDGETS_FILE, "utf8"));
const defaultKb = budgets.firstLoadJsGzipKb.default;
const routeBudgets = budgets.firstLoadJsGzipKb.routes ?? {};

function walkHtml(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkHtml(full));
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

function routeFor(htmlPath) {
  const rel = relative(OUT_DIR, htmlPath);
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html"))
    return "/" + rel.slice(0, -"/index.html".length);
  return "/" + rel.replace(/\.html$/, "");
}

const jsRef = /(?:src|href)="(\/_next\/[^"]+\.js)"/g;
const gzCache = new Map();

function gzKb(url) {
  if (!gzCache.has(url)) {
    const file = join(OUT_DIR, url.replace(/^\//, ""));
    const bytes = existsSync(file) ? gzipSync(readFileSync(file)).length : 0;
    gzCache.set(url, bytes);
  }
  return gzCache.get(url);
}

// Skip Next internal placeholder routes — not user-facing surfaces.
const SKIP = new Set(["/404", "/_not-found"]);

const rows = [];
for (const html of walkHtml(OUT_DIR)) {
  const route = routeFor(html);
  if (SKIP.has(route)) continue;
  const content = readFileSync(html, "utf8");
  const urls = new Set();
  for (const m of content.matchAll(jsRef)) urls.add(m[1]);
  const bytes = [...urls].reduce((sum, u) => sum + gzKb(u), 0);
  const kb = bytes / 1024;
  const budget = routeBudgets[route] ?? defaultKb;
  rows.push({ route, kb, budget, over: kb > budget });
}

rows.sort((a, b) => a.route.localeCompare(b.route));

const pad = (s, n) => String(s).padEnd(n);
console.log(`\nFirst-load JS (gzip) — budget from ${BUDGETS_FILE}\n`);
console.log(
  `  ${pad("route", 24)}${pad("gz KB", 10)}${pad("budget", 10)}status`,
);
console.log(`  ${"-".repeat(50)}`);
for (const r of rows) {
  console.log(
    `  ${pad(r.route, 24)}${pad(r.kb.toFixed(1), 10)}${pad(r.budget, 10)}${r.over ? "OVER" : "ok"}`,
  );
}

console.log("");
const failures = rows
  .filter((r) => r.over)
  .map(
    (b) =>
      `${b.route}: ${b.kb.toFixed(1)} KB exceeds ${b.budget} KB first-load budget`,
  );

// 3D payload guard — total uncompressed chunk JS (a proxy for the initial 3D
// payload the world route lazy-loads), gated by world3dPayloadMb.
let payloadBytes = 0;
function sumJs(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sumJs(full);
    else if (name.endsWith(".js")) payloadBytes += statSync(full).size;
  }
}
sumJs(join(OUT_DIR, "_next/static/chunks"));
const payloadMb = payloadBytes / 1024 / 1024;
const payloadBudget = budgets.world3dPayloadMb;
console.log(
  `3D payload (all chunks, uncompressed): ${payloadMb.toFixed(2)} MB / ${payloadBudget} MB\n`,
);
if (payloadMb > payloadBudget) {
  failures.push(
    `3D payload ${payloadMb.toFixed(2)} MB exceeds ${payloadBudget} MB`,
  );
}

if (failures.length > 0) {
  console.error("✗ budget breaches:");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`✓ ${rows.length} routes + 3D payload within budget\n`);
