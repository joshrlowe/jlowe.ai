-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- KnowledgeChunk table
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceSlug" TEXT,
    "sourceTitle" TEXT NOT NULL,
    "headingPath" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "embedding" vector(1024),
    "tsv" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- Lookups by (sourceType, sourceId)
CREATE INDEX "knowledge_chunks_sourceType_sourceId_idx"
    ON "knowledge_chunks"("sourceType", "sourceId");

-- Uniqueness for upsert: one row per (sourceType, sourceId, chunkIndex)
CREATE UNIQUE INDEX "knowledge_chunks_sourceType_sourceId_chunkIndex_key"
    ON "knowledge_chunks"("sourceType", "sourceId", "chunkIndex");

-- HNSW index on embedding for cosine similarity (operator: <=>)
CREATE INDEX "knowledge_chunks_embedding_hnsw"
    ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops);

-- GIN index on tsvector for full-text search
CREATE INDEX "knowledge_chunks_tsv_gin"
    ON "knowledge_chunks" USING GIN ("tsv");

-- Auto-populate tsv from content on insert/update
CREATE OR REPLACE FUNCTION knowledge_chunks_tsv_trigger() RETURNS trigger AS $$
BEGIN
    NEW."tsv" := to_tsvector(
        'english',
        COALESCE(NEW."sourceTitle", '') || ' ' || COALESCE(NEW."content", '')
    );
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_chunks_tsv_update
    BEFORE INSERT OR UPDATE OF "content", "sourceTitle"
    ON "knowledge_chunks"
    FOR EACH ROW
    EXECUTE FUNCTION knowledge_chunks_tsv_trigger();
