/**
 * Pure starfield math for the in-transit hold scene — no `three` import, so
 * it's unit-testable without a GPU. Deterministic (seeded mulberry32, per the
 * seeded-scatter law: no runtime `Math.random()`), so every visit renders the
 * same sky and poses stay testable.
 */

export interface Starfield {
  /** xyz triples on a spherical shell around the origin. */
  positions: Float32Array;
  /** Linear rgb triples — brightness-varied, mostly cool with a few warm. */
  colors: Float32Array;
}

/** Small fast seeded PRNG (mulberry32) — uniform floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `count` stars uniformly distributed in direction (z = 2u−1 keeps the poles
 * unbunched) on a shell between `minRadius` and `maxRadius`. Colours are
 * brightness-varied white with a cool cast; roughly one in six leans warm —
 * enough variation to read as a real sky, not confetti.
 */
export function buildStarfield(
  count: number,
  seed: number,
  minRadius = 60,
  maxRadius = 140,
): Starfield {
  const rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Uniform direction on the unit sphere.
    const z = 2 * rand() - 1;
    const theta = 2 * Math.PI * rand();
    const s = Math.sqrt(Math.max(0, 1 - z * z));
    const r = minRadius + (maxRadius - minRadius) * rand();

    positions[i * 3] = s * Math.cos(theta) * r;
    positions[i * 3 + 1] = z * r;
    positions[i * 3 + 2] = s * Math.sin(theta) * r;

    const brightness = 0.3 + 0.7 * rand();
    const warm = rand() < 0.16;
    colors[i * 3] = brightness * (warm ? 1 : 0.82);
    colors[i * 3 + 1] = brightness * (warm ? 0.82 : 0.88);
    colors[i * 3 + 2] = brightness * (warm ? 0.62 : 1);
  }

  return { positions, colors };
}
