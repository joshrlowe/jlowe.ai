export { chunkMarkdown, type Chunk, type ChunkOptions } from "./chunker.js";
export { rrfMerge, type RankedItem, type FusedScore } from "./rrf.js";
export {
  tokenize,
  termFrequencies,
  buildBm25Stats,
  bm25Score,
  bm25Rank,
  idf,
  type Bm25Hit,
} from "./bm25.js";
export { contentSha256 } from "./hash.js";
export {
  buildIndex,
  loadPublicCorpus,
  hashesFromDocs,
  renderIndexModule,
  hashSetFingerprint,
  type CorpusDoc,
} from "./build-index.js";
export { checkFreshness, FRESHNESS_HINT } from "./freshness.js";
export { CORPUS_INDEX } from "./index.generated.js";
export {
  INDEX_VERSION,
  BM25_K1,
  BM25_B,
  RRF_K,
  HYBRID_TOP_N,
  type IndexedChunk,
  type Bm25Stats,
  type CorpusIndex,
} from "./types.js";
