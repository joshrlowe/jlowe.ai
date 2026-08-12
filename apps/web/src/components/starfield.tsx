/*
 * Fixed deep-space backdrop for the flat shell — the still frame the
 * hyperspace entrance settles into, so the arrival lands in the same
 * universe the site then lives in.
 *
 * Zero-asset and zero-JS: a seeded PRNG builds one SVG star tile at module
 * scope (build time / server render — deterministic, so SSG output is
 * byte-stable and there is nothing to hydrate), inlined as a data: URI
 * background. Star density matches the entrance's settled field (one star
 * per ~4200 px², SETTLE_DENSITY_PX2) for continuity. Two whisper-faint
 * radial washes (deep blue #0a1e6e, cobalt #2a63ff) add cosmic depth.
 *
 * Constraints honored by construction:
 *  - Static — no animation, so prefers-reduced-motion changes nothing.
 *  - Layout-inert (fixed, inset-0, -z-10) — zero CLS. It paints above the
 *    body background (which propagates to the canvas since <html> sets no
 *    background of its own) and below all content; opaque surfaces (cards,
 *    header, the hs-exit page card) occlude it.
 *  - Contrast-safe: wash peaks lift the effective background luminance from
 *    0.0010 to at most 0.0036 — foreground text still measures 17.3:1
 *    (18.1:1 on bare bg); star points are capped at 0.5 opacity, sub-glyph
 *    sized (r ≤ 1.1px), and cover ~0.04% of area.
 *  - aria-hidden + pointer-events-none: invisible to AT and input.
 */

const TILE = 720; // px — large enough that the repeat is imperceptible
const DENSITY_PX2 = 4200; // one star per this many px² (entrance parity)

/** Tiny deterministic PRNG (mulberry32) — fixed seed, stable across builds. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStarTile(): string {
  const rand = mulberry32(0x02030a); // the deep-space hex, naturally
  const count = Math.round((TILE * TILE) / DENSITY_PX2);
  let starlight = "";
  let white = "";
  for (let i = 0; i < count; i++) {
    const x = (rand() * TILE).toFixed(1);
    const y = (rand() * TILE).toFixed(1);
    const b = rand(); // brightness draw; squared so most stars stay faint
    const r = (0.4 + 0.7 * b * b).toFixed(2);
    const o = (0.12 + 0.38 * b).toFixed(2); // opacity capped at 0.5
    const dot = `<circle cx="${x}" cy="${y}" r="${r}" opacity="${o}"/>`;
    // A small bright-white population reads as the nearest stars.
    if (b > 0.88) white += dot;
    else starlight += dot;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}">` +
    `<g fill="#bcd9ff">${starlight}</g><g fill="#ffffff">${white}</g></svg>`
  );
}

const STAR_TILE = `url("data:image/svg+xml,${encodeURIComponent(buildStarTile())}")`;

const BACKDROP = [
  // Deep-blue halo bleeding in from above the viewport.
  "radial-gradient(120% 90% at 50% -20%, rgb(10 30 110 / 0.10), transparent 60%)",
  // Cobalt whisper rising from the lower-right horizon.
  "radial-gradient(90% 70% at 85% 110%, rgb(42 99 255 / 0.05), transparent 55%)",
  STAR_TILE,
].join(", ");

export function Starfield() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundImage: BACKDROP,
        backgroundRepeat: "no-repeat, no-repeat, repeat",
      }}
    />
  );
}
