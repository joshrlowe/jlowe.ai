// Placeholder recent-activity items + a deterministic, seeded contribution
// grid (no GitHub API calls in Phase 0 — static export stays self-contained).

export interface ActivityItem {
  date: string; // ISO date
  kind: "project" | "article" | "update";
  title: string;
}

export const RECENT_ACTIVITY: readonly ActivityItem[] = [
  {
    date: "2026-06-12",
    kind: "project",
    title: "Kicked off Velocity — the 3D rebuild of jlowe.ai",
  },
  {
    date: "2026-05-15",
    kind: "update",
    title: "Hardened the v1 chat funnel and moderation pipeline",
  },
  // NOTE: the "Progressive enhancement for 3D sites" article is a draft hidden
  // from the public build (corpus frontmatter `visibility: private`), so it is
  // deliberately omitted here — this strip renders into the indexed homepage and
  // must not surface a hidden draft. Re-add an entry when the article is
  // un-hidden (flip its frontmatter back to `visibility: public`).
  {
    date: "2026-03-10",
    kind: "article",
    title: "RAG that cites its sources",
  },
] as const;

/** Deterministic PRNG so the placeholder grid is stable across builds. */
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

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

/** 52 weeks x 7 days of placeholder contribution intensities. */
export function contributionGrid(seed = 20260612): ContributionLevel[][] {
  const rand = mulberry32(seed);
  return Array.from({ length: 52 }, () =>
    Array.from({ length: 7 }, () => {
      const r = rand();
      if (r < 0.38) return 0;
      if (r < 0.62) return 1;
      if (r < 0.8) return 2;
      if (r < 0.93) return 3;
      return 4;
    }),
  );
}
