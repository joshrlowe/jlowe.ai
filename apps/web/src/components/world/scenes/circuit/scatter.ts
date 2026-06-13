/** Deterministic PRNG so scattered scenery is stable across builds. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  next: () => number;
  range: (lo: number, hi: number) => number;
}

export function scatter<T>(
  count: number,
  seed: number,
  make: (rng: Rng, index: number) => T,
): T[] {
  const r = mulberry32(seed);
  const rng: Rng = { next: r, range: (lo, hi) => lo + r() * (hi - lo) };
  return Array.from({ length: count }, (_, i) => make(rng, i));
}
