// Runtime surface only. The index builder (gray-matter / marked / fs) is not
// re-exported so it stays out of the chat Lambda bundle.
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
export { cosine } from "./cosine.js";
export {
  generateQueryEmbedding,
  TITAN_EMBED_MODEL_ID,
  EMBEDDING_DIMENSIONS,
} from "./embed.js";
export {
  searchKnowledge,
  type RetrievedChunk,
  type SearchKnowledgeOptions,
} from "./search.js";
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
