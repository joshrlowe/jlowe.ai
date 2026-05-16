-- AI moderation pipeline for comments (Phase 4 / 05).
-- See lib/moderation/README.md for thresholds and fail-open semantics.

-- AlterTable: flip the legacy `approved` default to false. New writes still
-- set `approved` explicitly (mirrored from `moderationStatus`), so the
-- default only matters for any path that bypasses the pipeline.
ALTER TABLE "comments" ALTER COLUMN "approved" SET DEFAULT false;

-- AlterTable: add the moderation columns. `moderationStatus` defaults to
-- 'approved' so the schema-level default matches the historical
-- behaviour of `approved=true`. Existing rows are backfilled below.
ALTER TABLE "comments"
  ADD COLUMN "moderationStatus" TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN "moderationScores" JSONB,
  ADD COLUMN "moderationModel"  TEXT,
  ADD COLUMN "moderatedAt"      TIMESTAMP(3);

-- Backfill: pre-existing rows preserve their meaning. Anything that was
-- already `approved=true` stays publicly visible; anything `approved=false`
-- moves to the new "held" bucket so admins can review or release it.
UPDATE "comments"
   SET "moderationStatus" = CASE WHEN "approved" THEN 'approved' ELSE 'held' END;

-- CreateIndex: query path for the admin review page (held + recent rows
-- ordered by createdAt) and for the public read filter.
CREATE INDEX "comments_moderationStatus_createdAt_idx"
  ON "comments" ("moderationStatus", "createdAt");
