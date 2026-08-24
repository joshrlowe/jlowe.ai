import { contentSha256 } from "../hash.js";
import type { CorpusIndex } from "../types.js";

/**
 * Staleness key for committed query vectors. If a chunk's content hash
 * changes, this fingerprint moves and CI fails with "run `pnpm eval:golden`".
 */
export function corpusFingerprint(index: CorpusIndex): string {
  const lines = index.chunks
    .map((chunk) => `${chunk.id}:${chunk.contentHash}`)
    .sort();
  return contentSha256(lines.join("\n"));
}
