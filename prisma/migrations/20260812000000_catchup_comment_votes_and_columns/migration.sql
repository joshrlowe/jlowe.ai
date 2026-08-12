-- Catch-up baseline for drift created by applying schema changes to
-- production with `prisma db push` instead of committed migrations.
-- See docs/decisions/0004-db-push-workflow-and-migration-baseline.md.
--
-- Everything below already exists in production (created by db push), so
-- every statement is guarded (IF NOT EXISTS / pg_constraint checks) and the
-- whole file is a no-op there. On a fresh database, replaying the migration
-- history now yields the same schema as `prisma db push` from
-- prisma/schema.prisma.
--
-- To reconcile production without re-running this SQL, verify the diff is
-- empty with `prisma migrate diff`, then mark it applied:
--   npx prisma migrate resolve --applied 20260812000000_catchup_comment_votes_and_columns

-- AlterTable: comment threading + denormalized vote counters. These shipped
-- with the reply/vote feature but were never captured in a migration.
ALTER TABLE "comments"
  ADD COLUMN IF NOT EXISTS "likes"    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dislikes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "parentId" TEXT;

-- CreateIndex: reply lookups by parent
CREATE INDEX IF NOT EXISTS "comments_parentId_idx" ON "comments"("parentId");

-- AddForeignKey: self-referencing FK for comment replies. Postgres has no
-- ADD CONSTRAINT IF NOT EXISTS, so guard via pg_constraint.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'comments_parentId_fkey'
          AND conrelid = 'comments'::regclass
    ) THEN
        ALTER TABLE "comments"
            ADD CONSTRAINT "comments_parentId_fkey"
            FOREIGN KEY ("parentId") REFERENCES "comments"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- CreateTable: per-IP like/dislike votes on comments (model CommentVote)
CREATE TABLE IF NOT EXISTS "comment_votes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userIP" TEXT NOT NULL,
    "voteType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: vote lookups by comment
CREATE INDEX IF NOT EXISTS "comment_votes_commentId_idx" ON "comment_votes"("commentId");

-- CreateIndex: uniqueness — one vote per (comment, IP)
CREATE UNIQUE INDEX IF NOT EXISTS "comment_votes_commentId_userIP_key"
    ON "comment_votes"("commentId", "userIP");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'comment_votes_commentId_fkey'
          AND conrelid = 'comment_votes'::regclass
    ) THEN
        ALTER TABLE "comment_votes"
            ADD CONSTRAINT "comment_votes_commentId_fkey"
            FOREIGN KEY ("commentId") REFERENCES "comments"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- AlterTable: optional subtitle for the leadership section
ALTER TABLE "about"
  ADD COLUMN IF NOT EXISTS "leadershipSubtitle" TEXT;

-- AlterTable: contact hero carousel words + editable subtitle
ALTER TABLE "contact"
  ADD COLUMN IF NOT EXISTS "heroWords" JSONB,
  ADD COLUMN IF NOT EXISTS "heroSubtitle" TEXT;

-- AlterTable: fallback background image + associated papers
ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "backgroundImage" TEXT,
  ADD COLUMN IF NOT EXISTS "papers" JSONB;

-- AlterTable: owner name, footer title, and home-page section toggles
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "ownerName" TEXT,
  ADD COLUMN IF NOT EXISTS "footerTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "enabledSections" JSONB;
