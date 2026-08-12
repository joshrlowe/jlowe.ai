# 0004 — db push workflow and catch-up migration baseline

## Status

Accepted, 2026-08-11

## Context

Production's schema is applied with `prisma db push` plus manual operations
against the database. Nothing in the deploy pipeline runs
`prisma migrate deploy`: `package.json`'s `build` script is
`prisma generate && next build` and `postinstall` is `prisma generate` —
both only generate the client. The committed migration history in
`prisma/migrations/` is therefore replayed only on fresh databases (local
dev via `prisma migrate dev`, CI, shadow databases), never in production.

That split let the two sources of truth drift. `db push` diffs the live
database against `prisma/schema.prisma` directly and writes no migration
files, so several schema changes shipped to production without ever being
captured in `prisma/migrations/`. As of the last migration
(`20260508120000_comment_moderation`), the history was missing:

- The entire `comment_votes` table (model `CommentVote`), including its
  unique `(commentId, userIP)` index, `commentId` index, and cascade FK.
- `comments.likes`, `comments.dislikes`, and `comments.parentId` (comment
  threading), plus the `comments_parentId_idx` index and the
  self-referencing `comments_parentId_fkey` constraint.
- `about.leadershipSubtitle`
- `contact.heroWords`, `contact.heroSubtitle`
- `projects.backgroundImage`, `projects.papers`
- `site_settings.ownerName`, `site_settings.footerTitle`,
  `site_settings.enabledSections`

A fresh database built from migrations alone would not match
`schema.prisma`, and `prisma migrate dev` would try to generate the whole
backlog as one auto-named migration on its next run.

Separately, production still contains the `resources` table (and possibly
its `content_type` enum). Migration `20251225050335_add_indexes` drops it,
but that migration never ran in production and `db push` preserved the
table's data. It is an orphan: no model in `schema.prisma` references it,
and `scripts/migrate-resources-to-posts.js` exists to convert its rows to
`posts`.

## Decision

1. **Accept `db push` + manual ops as the production workflow for now.**
   Deploys intentionally do not run migrations — the build must not couple
   to database availability or hold DDL locks during a Vercel build.
2. **Add a hand-written catch-up migration**,
   `prisma/migrations/20260812000000_catchup_comment_votes_and_columns/`,
   that re-states every drifted object. All statements are guarded
   (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`,
   `pg_constraint` checks for FKs) so the file is a no-op against
   production, where everything already exists, and fully constructive on
   fresh databases. After it, migration history and `schema.prisma`
   converge again.
3. **Keep committing a matching migration alongside every future schema
   change** (the existing stated practice), even though production applies
   the change via `db push`. The history stays replayable; production
   marks each migration applied instead of running it.
4. **Leave the orphan `resources` table in production.** Its data is
   preserved; dropping it is a future decision to be taken deliberately
   (after confirming the `resources` → `posts` conversion is complete),
   not as a side effect of this baseline.

### Reconciling production

After verifying the drift is exactly covered:

```bash
# 1. Migrations vs. schema — expect an empty diff
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url <scratch-postgres-url>

# 2. Production vs. schema — expect an empty diff
#    (modulo the orphan `resources` table, see above)
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma
```

mark the catch-up migration as applied without executing it:

```bash
npx prisma migrate resolve --applied 20260812000000_catchup_comment_votes_and_columns
```

If production has no `_prisma_migrations` table (it has never seen
`migrate deploy` or `migrate resolve`), baseline the full history first by
running `migrate resolve --applied <name>` for each of the five earlier
migration directories in order, then the catch-up.

## Consequences

- Fresh environments (local `migrate dev`, CI databases, shadow databases)
  now build the complete schema from history alone.
- The next `prisma migrate dev` run generates only the new change instead
  of a surprise backlog migration.
- The guarded SQL style deviates from Prisma's generated dialect; it is
  required here so the same file is safe against both empty and
  already-pushed databases. Future generated migrations should stay in the
  normal unguarded style.
- Drift can recur under this workflow. Re-running the two `migrate diff`
  commands above is the check; any non-empty diff means a schema change
  shipped without a migration and needs another catch-up (or the workflow
  needs revisiting, see below).
- Production keeps an orphan `resources` table until a deliberate drop
  decision is made.

## Triggers to revisit

- Drift recurs (a `migrate diff` between migrations and `schema.prisma`
  comes back non-empty a second time) — consider switching production to
  `migrate deploy` for real.
- The deploy pipeline gains a safe place to run migrations (e.g. a release
  step outside the Vercel build).
- The `resources` → `posts` conversion is verified complete — decide the
  orphan table's drop in its own migration/ADR.
- Prisma 7 lands (ADR-0001) and changes the migrate/push toolchain.
