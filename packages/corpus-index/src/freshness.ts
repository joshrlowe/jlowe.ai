import { hashesFromDocs, loadPublicCorpus } from "./build-index.js";

export const FRESHNESS_HINT = "run `pnpm index`";

export interface FreshnessResult {
  ok: boolean;
  message: string;
  expected: string[];
  committed: string[];
}

export function checkFreshness(
  repoRoot: string,
  committedHashes: readonly string[],
): FreshnessResult {
  const expected = hashesFromDocs(loadPublicCorpus(repoRoot));
  const committed = [...committedHashes].sort();
  const expectedSet = new Set(expected);
  const committedSet = new Set(committed);
  const missing = expected.filter((h) => !committedSet.has(h));
  const extra = committed.filter((h) => !expectedSet.has(h));

  if (missing.length === 0 && extra.length === 0) {
    return {
      ok: true,
      message: `index: ${expected.length} chunk hashes match`,
      expected,
      committed,
    };
  }

  const parts = [`corpus index is stale — ${FRESHNESS_HINT}`];
  if (missing.length) {
    parts.push(
      `missing ${missing.length} hash(es) from current corpus: ${missing.slice(0, 3).join(", ")}`,
    );
  }
  if (extra.length) {
    parts.push(
      `${extra.length} committed hash(es) are no longer in the corpus`,
    );
  }
  return {
    ok: false,
    message: parts.join(". "),
    expected,
    committed,
  };
}
